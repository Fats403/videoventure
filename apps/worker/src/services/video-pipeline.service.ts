import * as fs from "fs";
import * as path from "path";
import { db } from "../db";
import { FalService } from "./fal.service";
import { AudioService } from "./audio.service";
import {
  VideoProcessingService,
  SceneWithAudio,
} from "./video-processing.service";
import {
  SupabaseStorageService,
  videoProjects,
  eq,
} from "@video-venture/shared/server";
import type { ProjectStatus, VideoHistory } from "@video-venture/shared";
import { SubtitleService } from "./subtitle.service";

export class VideoPipelineService {
  private falService: FalService;
  private audioService: AudioService;
  private videoProcessingService: VideoProcessingService;
  private storageService: SupabaseStorageService;
  private subtitleService: SubtitleService;
  private tempDir: string;

  constructor() {
    this.falService = new FalService();
    this.audioService = new AudioService();
    this.videoProcessingService = new VideoProcessingService();
    this.storageService = new SupabaseStorageService();
    this.subtitleService = new SubtitleService();
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

      // Step 2: Submit all video generation jobs
      console.log(`🚀 Starting video generation for ${scenes.length} scenes`);
      const videoJobs = await Promise.all(
        scenes.map((scene) =>
          this.falService.generateSceneVideo(scene, settings, jobId, userId)
        )
      );

      // Step 3: Poll for video completion with progress callback
      const completedVideoJobs = await this.falService.pollVideoJobs(
        videoJobs,
        async (progress) => {
          await this.updateProjectStatus(
            videoId,
            jobId,
            "generating",
            5 + Math.round(progress * 20) // 5-25%
          );
        }
      );

      await this.updateProjectStatus(videoId, jobId, "generating", 25);

      // Step 4: Generate music (only after videos are complete)
      const totalDuration = scenes.length * 5; // Estimate based on scene count
      console.log(`🎵 Starting music generation for ${totalDuration}s`);
      const musicJob = await this.falService.generateMusic(
        breakdown.musicDescription || "Upbeat background music",
        totalDuration,
        jobId,
        userId,
        videoId
      );

      // Step 5: Poll for music completion with progress callback
      await this.falService.pollMusicJob(musicJob, async (progress) => {
        await this.updateProjectStatus(
          videoId,
          jobId,
          "generating",
          25 + Math.round(progress * 15) // 25-40%
        );
      });

      await this.updateProjectStatus(videoId, jobId, "generating", 40);

      // Step 6: Generate audio for each scene
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

      await this.updateProjectStatus(videoId, jobId, "generating", 50);

      // Step 7: Download videos and process scenes with audio
      const scenesWithAudio: SceneWithAudio[] = [];

      for (let i = 0; i < completedVideoJobs.length; i++) {
        const job = completedVideoJobs[i];
        const scene = scenes[i];
        const sceneNumber = scene.order + 1;

        const sceneDir = path.join(jobTempDir, `scene-${sceneNumber}`);
        if (!fs.existsSync(sceneDir)) {
          fs.mkdirSync(sceneDir, { recursive: true });
        }

        // Download video from Supabase
        const videoPath = path.join(sceneDir, `video.mp4`);
        await this.videoProcessingService.downloadVideoFromStorage(
          job.storageKey,
          videoPath
        );

        const audioPath = audioResults[i].audioPath;
        const audioDuration =
          await this.audioService.getAudioDuration(audioPath);

        // Upload audio to Supabase
        const audioStorageKey = `users/${userId}/projects/${videoId}/scenes/scene-${sceneNumber}/audio.wav`;
        await this.videoProcessingService.uploadFileToStorage(
          audioPath,
          audioStorageKey,
          "audio/wav"
        );

        scenesWithAudio.push({
          sceneNumber,
          videoPath,
          audioPath,
          duration: audioDuration,
          storageKey: job.storageKey,
        });
      }

      await this.updateProjectStatus(videoId, jobId, "generating", 60);

      // Step 8: Combine audio with videos and add subtitles
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

      // Step 9: Combine all scenes
      const finalVideoPath = path.join(jobTempDir, "final_video.mp4");
      await this.videoProcessingService.combineVideos(
        combinedScenePaths,
        finalVideoPath
      );

      await this.updateProjectStatus(videoId, jobId, "generating", 75);

      // Step 10: Download music from Supabase
      const musicPath = path.join(jobTempDir, "background_music.wav");
      await this.storageService.downloadFile(musicJob.storageKey, musicPath);

      // Step 11: Add music to final video
      const finalVideoWithMusicPath = path.join(
        jobTempDir,
        "final_video_with_music.mp4"
      );
      await this.videoProcessingService.addMusicToVideo(
        finalVideoPath,
        musicPath,
        finalVideoWithMusicPath
      );

      await this.updateProjectStatus(videoId, jobId, "generating", 85);

      // Step 12: Upload final video to Supabase
      const videoStorageKey = `users/${userId}/projects/${videoId}/video/final_v1.mp4`;
      await this.videoProcessingService.uploadFileToStorage(
        finalVideoWithMusicPath,
        videoStorageKey,
        "video/mp4"
      );

      // Step 13: Generate and upload thumbnail
      const thumbnailPath = path.join(jobTempDir, "thumbnail.jpg");
      await this.videoProcessingService.generateThumbnail(
        finalVideoWithMusicPath,
        thumbnailPath,
        1,
        settings.aspectRatio
      );

      const thumbnailStorageKey = `users/${userId}/projects/${videoId}/thumbnail.jpg`;
      const thumbnailUrl =
        await this.videoProcessingService.uploadFileToStorage(
          thumbnailPath,
          thumbnailStorageKey,
          "image/jpeg"
        );

      // Step 14: Complete the project
      await this.completeProject(
        videoId,
        jobId,
        scenesWithAudio.reduce((sum, scene) => sum + scene.duration, 0),
        thumbnailUrl
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
