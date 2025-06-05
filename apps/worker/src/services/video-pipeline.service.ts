import * as fs from "fs";
import * as path from "path";
import { db } from "../db";
import { VideoGenerationService } from "./video-generation.service";
import { AudioService } from "./audio.service";
import { MusicService } from "./music.service";
import {
  VideoProcessingService,
  SceneWithAudio,
} from "./video-processing.service";
import { S3Service, videoProjects, eq } from "@video-venture/shared/server";
import type { ProjectStatus, VideoHistory } from "@video-venture/shared";
import { SubtitleService } from "./subtitle.service";

export class VideoPipelineService {
  private videoGenerationService: VideoGenerationService;
  private audioService: AudioService;
  private musicService: MusicService;
  private videoProcessingService: VideoProcessingService;
  private s3Service: S3Service;
  private subtitleService: SubtitleService;
  private s3BucketName: string;
  private tempDir: string;

  constructor() {
    this.videoGenerationService = new VideoGenerationService();
    this.audioService = new AudioService();
    this.musicService = new MusicService();
    this.videoProcessingService = new VideoProcessingService();
    this.s3Service = new S3Service();
    this.subtitleService = new SubtitleService();
    this.s3BucketName = process.env.S3_BUCKET_NAME || "";
    this.tempDir = path.join(process.cwd(), "temp");

    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Process a video project
   */
  async processVideo({
    jobId,
    videoId,
    userId,
  }: {
    jobId: string;
    videoId: string;
    userId: string;
  }): Promise<void> {
    // Create a temporary directory for the job
    const jobTempDir = path.join(this.tempDir, jobId);
    if (!fs.existsSync(jobTempDir)) {
      fs.mkdirSync(jobTempDir, { recursive: true });
    }

    // Fetch project from PostgreSQL
    const [project] = await db
      .select()
      .from(videoProjects)
      .where(eq(videoProjects.id, videoId))
      .limit(1);

    if (!project) {
      throw new Error("Video project not found");
    }

    if (!project.breakdown?.scenes || !project.settings) {
      throw new Error("Project missing required breakdown or settings data");
    }

    const { breakdown, settings, concept } = project;
    const scenes = breakdown.scenes;
    const voiceId = concept?.voiceId;

    try {
      // Step 1: Start processing
      await this.updateProjectStatus(videoId, jobId, "generating", 5);

      // Step 2: Generate videos for each scene
      const videoJobs = await Promise.all(
        scenes.map((scene) =>
          this.videoGenerationService.generateSceneVideo(
            scene,
            settings,
            jobId,
            this.s3BucketName
          )
        )
      );

      // Step 3: Poll for completion
      const completedVideoJobs =
        await this.videoGenerationService.pollVideoJobs(
          videoJobs,
          async (progress) => {
            await this.updateProjectStatus(
              videoId,
              jobId,
              "generating",
              5 + Math.round(progress * 20)
            );
          }
        );

      await this.updateProjectStatus(videoId, jobId, "generating", 25);

      // Step 4: Generate audio
      const audioResults = await Promise.all(
        scenes.map((scene) =>
          this.audioService.generateVoiceOverWithTimestamps(
            scene,
            jobId,
            this.tempDir,
            voiceId
          )
        )
      );

      await this.updateProjectStatus(videoId, jobId, "generating", 40);

      // Step 5: Process scenes with audio
      const scenesWithAudio: SceneWithAudio[] = [];

      for (let i = 0; i < completedVideoJobs.length; i++) {
        const job = completedVideoJobs[i];
        const scene = scenes[i];
        const sceneNumber = scene.order + 1;

        const sceneDir = path.join(jobTempDir, `scene-${sceneNumber}`);
        if (!fs.existsSync(sceneDir)) {
          fs.mkdirSync(sceneDir, { recursive: true });
        }

        const videoPath = path.join(sceneDir, `video.mp4`);
        await this.videoProcessingService.downloadVideoFromS3(
          this.s3BucketName,
          job.s3Key,
          videoPath
        );

        const audioPath = audioResults[i].audioPath;
        const audioDuration =
          await this.audioService.getAudioDuration(audioPath);

        const scenePaths = this.s3Service.getScenePaths(
          userId,
          videoId,
          sceneNumber,
          1
        );

        await this.s3Service.uploadFile(
          audioPath,
          this.s3BucketName,
          scenePaths.audio
        );
        await this.s3Service.uploadFile(
          videoPath,
          this.s3BucketName,
          scenePaths.video
        );

        scenesWithAudio.push({
          sceneNumber,
          videoPath,
          audioPath,
          duration: audioDuration,
          s3Key: scenePaths.video,
        });
      }

      await this.updateProjectStatus(videoId, jobId, "generating", 60);

      // Step 6: Combine audio with videos and add subtitles
      const combinedScenePaths: string[] = [];

      for (let i = 0; i < scenesWithAudio.length; i++) {
        const scene = scenesWithAudio[i];
        const wordTimestamps = audioResults[i].wordTimestamps;

        const withAudioPath = path.join(
          jobTempDir,
          `scene-${scene.sceneNumber}-with-audio.mp4`
        );
        await this.videoProcessingService.addAudioToVideo(
          scene.videoPath,
          scene.audioPath,
          withAudioPath
        );

        const withSubtitlesPath = path.join(
          jobTempDir,
          `scene-${scene.sceneNumber}-combined.mp4`
        );
        await this.subtitleService.addSubtitlesToVideo(
          withAudioPath,
          wordTimestamps,
          withSubtitlesPath,
          {
            fontSize: 54,
            textColor: "#FFD32C",
            outlineColor: "#000000",
            outlineThickness: "thick",
            customFontPath: path.join(__dirname, "../fonts/integral-cf.otf"),
            position: "bottom-center",
          }
        );

        combinedScenePaths.push(withSubtitlesPath);
      }

      // Step 7: Combine all scenes
      const finalVideoPath = path.join(jobTempDir, "final_video.mp4");
      await this.videoProcessingService.combineVideos(
        combinedScenePaths,
        finalVideoPath
      );

      await this.updateProjectStatus(videoId, jobId, "generating", 75);

      // Step 8: Generate background music
      const totalDuration = scenesWithAudio.reduce(
        (sum, scene) => sum + scene.duration,
        0
      );
      const musicPath = await this.musicService.getBackgroundMusic(
        breakdown.musicDescription || "Upbeat background music",
        jobId,
        this.tempDir,
        totalDuration
      );

      const videoPaths = this.s3Service.getVideoPaths(userId, videoId, 1);
      await this.s3Service.uploadFile(
        musicPath,
        this.s3BucketName,
        videoPaths.music
      );

      await this.updateProjectStatus(videoId, jobId, "generating", 85);

      // Step 9: Add music to final video
      const finalVideoWithMusicPath = path.join(
        jobTempDir,
        "final_video_with_music.mp4"
      );
      await this.videoProcessingService.addMusicToVideo(
        finalVideoPath,
        musicPath,
        finalVideoWithMusicPath
      );

      await this.updateProjectStatus(videoId, jobId, "generating", 90);

      // Step 10: Upload final video
      await this.s3Service.uploadFile(
        finalVideoWithMusicPath,
        this.s3BucketName,
        videoPaths.video
      );

      // Step 11: Generate thumbnail
      const thumbnailPath = path.join(jobTempDir, "thumbnail.jpg");
      await this.videoProcessingService.generateThumbnail(
        finalVideoWithMusicPath,
        thumbnailPath,
        1,
        settings.aspectRatio
      );

      await this.s3Service.uploadFile(
        thumbnailPath,
        this.s3BucketName,
        videoPaths.thumbnail
      );

      // Step 12: Complete the project
      await this.completeProject(
        videoId,
        jobId,
        totalDuration,
        videoPaths.thumbnail
      );

      console.log(`✅ Video project ${videoId} completed successfully`);
      this.cleanupTempDirectory(jobTempDir);
    } catch (error: any) {
      console.error("❌ Error in video processing pipeline:", error.message);
      await this.failProject(videoId, jobId, error.message);
      this.cleanupTempDirectory(jobTempDir);
      throw error;
    }
  }

  /**
   * Update project status and progress
   */
  private async updateProjectStatus(
    videoId: string,
    jobId: string,
    status: ProjectStatus,
    progress: number
  ): Promise<void> {
    const [currentProject] = await db
      .select()
      .from(videoProjects)
      .where(eq(videoProjects.id, videoId))
      .limit(1);

    if (!currentProject) return;

    const updatedHistory: Record<string, VideoHistory> = {
      ...currentProject.history,
      [jobId]: {
        jobId,
        status: status === "generating" ? "PROCESSING" : "COMPLETED",
        type: "CREATE_VIDEO",
        createdAt: currentProject.history?.[jobId]?.createdAt || new Date(),
        updatedAt: new Date(),
        progress,
      },
    };

    await db
      .update(videoProjects)
      .set({
        status,
        history: updatedHistory,
        updatedAt: new Date(),
      })
      .where(eq(videoProjects.id, videoId));

    console.log(`Updated project ${videoId} - ${status} (${progress}%)`);
  }

  /**
   * Complete the project
   */
  private async completeProject(
    videoId: string,
    jobId: string,
    duration: number,
    thumbnailUrl: string
  ): Promise<void> {
    const [currentProject] = await db
      .select()
      .from(videoProjects)
      .where(eq(videoProjects.id, videoId))
      .limit(1);

    if (!currentProject) return;

    const updatedHistory: Record<string, VideoHistory> = {
      ...currentProject.history,
      [jobId]: {
        jobId,
        status: "COMPLETED",
        type: "CREATE_VIDEO",
        createdAt: currentProject.history?.[jobId]?.createdAt || new Date(),
        updatedAt: new Date(),
        progress: 100,
      },
    };

    await db
      .update(videoProjects)
      .set({
        status: "completed",
        history: updatedHistory,
        video: {
          duration,
          thumbnailUrl,
        },
        updatedAt: new Date(),
      })
      .where(eq(videoProjects.id, videoId));
  }

  /**
   * Mark project as failed
   */
  private async failProject(
    videoId: string,
    jobId: string,
    errorMessage: string
  ): Promise<void> {
    const [currentProject] = await db
      .select()
      .from(videoProjects)
      .where(eq(videoProjects.id, videoId))
      .limit(1);

    if (!currentProject) return;

    const updatedHistory: Record<string, VideoHistory> = {
      ...currentProject.history,
      [jobId]: {
        jobId,
        status: "FAILED",
        type: "CREATE_VIDEO",
        createdAt: currentProject.history?.[jobId]?.createdAt || new Date(),
        updatedAt: new Date(),
        errorMessage,
      },
    };

    await db
      .update(videoProjects)
      .set({
        status: "failed",
        history: updatedHistory,
        updatedAt: new Date(),
      })
      .where(eq(videoProjects.id, videoId));
  }

  private cleanupTempDirectory(jobTempDir: string): void {
    try {
      if (fs.existsSync(jobTempDir)) {
        console.log(`Cleaning up temporary directory: ${jobTempDir}`);
        fs.rmSync(jobTempDir, { recursive: true, force: true });
        console.log(`✅ Temporary directory cleaned up successfully`);
      }
    } catch (error: any) {
      console.warn(
        `Warning: Could not clean up temporary directory: ${error.message}`
      );
    }
  }
}
