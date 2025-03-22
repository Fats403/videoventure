import * as fs from "fs";
import * as path from "path";
import * as admin from "firebase-admin";
import { StoryboardService } from "./storyboard.service";
import { VideoGenerationService } from "./video-generation.service";
import { AudioService } from "./audio.service";
import { MusicService } from "./music.service";
import {
  VideoProcessingService,
  SceneWithAudio,
} from "./video-processing.service";
import {
  JobStatus,
  JobType,
  SceneData,
  VideoVisibility,
  S3Service,
} from "@video-venture/shared";
import { SubtitleService } from "./subtitle.service";

export class VideoPipelineService {
  private storyboardService: StoryboardService;
  private videoGenerationService: VideoGenerationService;
  private audioService: AudioService;
  private musicService: MusicService;
  private videoProcessingService: VideoProcessingService;
  private s3Service: S3Service;
  private db: admin.firestore.Firestore;
  private s3BucketName: string;
  private tempDir: string;
  private subtitleService: SubtitleService;

  constructor() {
    this.storyboardService = new StoryboardService();
    this.videoGenerationService = new VideoGenerationService();
    this.audioService = new AudioService();
    this.musicService = new MusicService();
    this.videoProcessingService = new VideoProcessingService();
    this.s3Service = new S3Service();
    this.db = admin.firestore();
    this.s3BucketName = process.env.S3_BUCKET_NAME || "";
    this.tempDir = path.join(process.cwd(), "temp");
    this.subtitleService = new SubtitleService();

    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Process a concept into a video
   * @param inputConcept - The concept to turn into a video
   * @param jobId - Unique ID for this job
   * @param videoId - Unique ID for this video
   * @param maxScenes - Maximum number of scenes
   * @param voiceId - ElevenLabs voice ID
   * @param videoModel - Video model
   * @param providerConfig - Provider-specific configuration
   * @returns Job result with video paths
   */
  async processConcept({
    inputConcept,
    jobId,
    videoId,
    userId,
    maxScenes = 5,
    voiceId = "JBFqnCBsd6RMkjVDRZzb",
    videoModel = "nova-reel",
    providerConfig = {},
  }: {
    inputConcept: string;
    jobId: string;
    videoId: string;
    userId: string;
    maxScenes: number;
    voiceId: string;
    videoModel: string;
    providerConfig?: Record<string, any>;
  }): Promise<void> {
    console.log(
      `Starting video pipeline for concept: "${inputConcept}" using model: ${videoModel}`
    );

    // Create job-specific directory
    const jobTempDir = path.join(this.tempDir, jobId);
    if (!fs.existsSync(jobTempDir)) {
      fs.mkdirSync(jobTempDir, { recursive: true });
    }

    try {
      // Update job status in Firestore
      await this.updateJobStatus(jobId, "IN_PROGRESS", {
        currentStep: "Generating storyboard",
        completedSteps: 0,
        totalSteps: 12,
        percentComplete: 0,
      });

      // Step 1: Generate storyboard
      const storyboard = await this.storyboardService.generateStoryboard(
        inputConcept,
        maxScenes
      );
      console.log(
        `Generated storyboard with ${storyboard.scenes.length} scenes`
      );

      // Update progress
      await this.updateJobStatus(jobId, "IN_PROGRESS", {
        currentStep: "Generating scene videos",
        completedSteps: 1,
        totalSteps: 12,
        percentComplete: 8,
      });

      // Step 2: Generate videos for each scene in parallel
      const videoJobs = await Promise.all(
        storyboard.scenes.map((scene) =>
          this.videoGenerationService.generateSceneVideo(
            scene,
            this.s3BucketName,
            videoModel,
            jobId,
            providerConfig
          )
        )
      );

      // Step 3: Poll for video generation completion
      const completedVideoJobs =
        await this.videoGenerationService.pollVideoJobs(
          videoJobs,
          jobId,
          async (progress) => {
            await this.updateJobStatus(jobId, "IN_PROGRESS", {
              currentStep: "Generating scene videos",
              completedSteps: 2,
              totalSteps: 12,
              percentComplete: 8 + Math.round(progress * 0.17), // 8-25% range for this step
            });
          }
        );

      // Update progress
      await this.updateJobStatus(jobId, "IN_PROGRESS", {
        currentStep: "Generating audio for scenes",
        completedSteps: 3,
        totalSteps: 12,
        percentComplete: 25,
      });

      // Step 4: Generate audio with timestamps
      const audioPromises = storyboard.scenes.map((scene) =>
        this.audioService.generateVoiceOverWithTimestamps(
          scene,
          jobId,
          this.tempDir,
          voiceId
        )
      );
      const audioResults = await Promise.all(audioPromises);
      const audioPaths = audioResults.map((result) => result.audioPath);

      // Update progress
      await this.updateJobStatus(jobId, "IN_PROGRESS", {
        currentStep: "Processing scene videos and audio",
        completedSteps: 4,
        totalSteps: 12,
        percentComplete: 33,
      });

      // Step 5: Download videos from S3 and prepare scenes
      const scenesWithAudio: SceneWithAudio[] = [];
      const sceneData: SceneData[] = [];

      for (let i = 0; i < completedVideoJobs.length; i++) {
        const job = completedVideoJobs[i];
        const scene = storyboard.scenes[i];
        const sceneNumber = scene.scene_number;

        // Create scene directory
        const sceneDir = path.join(jobTempDir, `scene-${sceneNumber}`);
        if (!fs.existsSync(sceneDir)) {
          fs.mkdirSync(sceneDir, { recursive: true });
        }

        // Download video
        const videoPath = path.join(sceneDir, `video.mp4`);
        await this.videoProcessingService.downloadVideoFromS3(
          this.s3BucketName,
          job.s3Key,
          videoPath
        );

        // Get audio path and duration
        const audioPath = audioPaths[i];
        const audioDuration = await this.audioService.getAudioDuration(
          audioPath
        );

        // Generate S3 paths for this scene
        const scenePaths = this.s3Service.getScenePaths(
          userId,
          videoId,
          sceneNumber,
          1
        );

        // Upload audio to S3
        await this.s3Service.uploadFile(
          audioPath,
          this.s3BucketName,
          scenePaths.audio
        );

        // Upload video to S3 (in the new structure)
        await this.s3Service.uploadFile(
          videoPath,
          this.s3BucketName,
          scenePaths.video
        );

        // Add to scenes array
        scenesWithAudio.push({
          sceneNumber,
          videoPath,
          audioPath,
          duration: audioDuration,
          s3Key: scenePaths.video,
        });

        // Add to scene data for the video document
        sceneData.push({
          sceneNumber,
          description: scene.visual_description,
          voiceover: scene.voiceover,
          duration: audioDuration,
          version: 1,
        });
      }

      // Update progress
      await this.updateJobStatus(jobId, "IN_PROGRESS", {
        currentStep: "Combining audio with videos",
        completedSteps: 5,
        totalSteps: 12,
        percentComplete: 42,
      });

      // Step 6: Combine audio with videos and add subtitles (for individual scenes)
      const combinedScenePaths: string[] = [];

      for (let i = 0; i < scenesWithAudio.length; i++) {
        const scene = scenesWithAudio[i];
        const sceneNumber = scene.sceneNumber;
        const wordTimestamps = audioResults[i].wordTimestamps;

        // First combine audio with video
        const withAudioPath = path.join(
          jobTempDir,
          `scene-${sceneNumber}-with-audio.mp4`
        );

        await this.videoProcessingService.addAudioToVideo(
          scene.videoPath,
          scene.audioPath,
          withAudioPath
        );

        // Add subtitles directly to video (using clean subtitle service with direct text overlay)
        const withSubtitlesPath = path.join(
          jobTempDir,
          `scene-${sceneNumber}-combined.mp4`
        );

        await this.subtitleService.addSubtitlesToVideo(
          withAudioPath,
          wordTimestamps,
          withSubtitlesPath,
          {
            fontSize: 60,
            textColor: "#FFD32C",
            outlineColor: "#000000",
            outlineThickness: "thick",
            position: "middle",
          }
        );

        combinedScenePaths.push(withSubtitlesPath);
      }

      // Step 7: Combine all scenes with audio and subtitles into one video
      // Each scene already has properly timed subtitles at this point
      const finalVideoPath = path.join(jobTempDir, "final_video.mp4");
      await this.videoProcessingService.combineVideos(
        combinedScenePaths,
        finalVideoPath
      );

      // Update progress
      await this.updateJobStatus(jobId, "IN_PROGRESS", {
        currentStep: "Generating background music",
        completedSteps: 7,
        totalSteps: 12,
        percentComplete: 58,
      });

      // Step 8: Generate background music
      const totalDuration = scenesWithAudio.reduce(
        (sum, scene) => sum + scene.duration,
        0
      );
      const musicPath = await this.musicService.getBackgroundMusic(
        inputConcept,
        jobId,
        this.tempDir,
        totalDuration
      );

      // Generate S3 paths for the video
      const videoPaths = this.s3Service.getVideoPaths(userId, videoId, 1);

      // Upload music to S3
      await this.s3Service.uploadFile(
        musicPath,
        this.s3BucketName,
        videoPaths.music
      );

      // Update progress
      await this.updateJobStatus(jobId, "IN_PROGRESS", {
        currentStep: "Adding music to final video",
        completedSteps: 8,
        totalSteps: 12,
        percentComplete: 67,
      });

      // Step 9: Add background music to final video
      const finalVideoWithMusicPath = path.join(
        jobTempDir,
        "final_video_with_music.mp4"
      );
      await this.videoProcessingService.addMusicToVideo(
        finalVideoPath, // Use the combined video that already has subtitles
        musicPath,
        finalVideoWithMusicPath
      );

      // Update progress
      await this.updateJobStatus(jobId, "IN_PROGRESS", {
        currentStep: "Uploading final video",
        completedSteps: 9,
        totalSteps: 12,
        percentComplete: 75,
      });

      // Step 10: Upload final video to S3
      await this.s3Service.uploadFile(
        finalVideoWithMusicPath,
        this.s3BucketName,
        videoPaths.video
      );

      // Update progress
      await this.updateJobStatus(jobId, "IN_PROGRESS", {
        currentStep: "Generating thumbnail",
        completedSteps: 10,
        totalSteps: 12,
        percentComplete: 83,
      });

      // Step 11: Generate and upload thumbnail
      const thumbnailPath = path.join(jobTempDir, "thumbnail.jpg");
      await this.videoProcessingService.generateThumbnail(
        finalVideoWithMusicPath,
        thumbnailPath
      );

      await this.s3Service.uploadFile(
        thumbnailPath,
        this.s3BucketName,
        videoPaths.thumbnail
      );

      // Update progress
      await this.updateJobStatus(jobId, "IN_PROGRESS", {
        currentStep: "Finalizing video",
        completedSteps: 11,
        totalSteps: 12,
        percentComplete: 92,
      });

      // Step 12: Update video document in Firestore
      await this.db
        .collection("videos")
        .doc(videoId)
        .set({
          videoId,
          userId,
          currentJobId: jobId,
          originalConcept: inputConcept,
          visualStyle: storyboard.visualStyle,
          title: storyboard.title,
          tags: storyboard.tags,
          duration: totalDuration,
          scenes: sceneData,
          visibility: "PRIVATE" as VideoVisibility,
          processingStatus: "COMPLETED" as JobStatus,
          processingHistory: [
            {
              jobId,
              type: "CREATE_VIDEO" as JobType,
              status: "COMPLETED" as JobStatus,
              timestamp: new Date().toISOString(),
            },
          ],
          views: 0,
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

      // Update job status to completed
      await this.updateJobStatus(jobId, "COMPLETED", {
        currentStep: "Completed",
        completedSteps: 12,
        totalSteps: 12,
        percentComplete: 100,
      });

      console.log(`✅ Video ID: ${videoId} pipeline completed successfully`);

      // Clean up temporary files
      this.cleanupTempDirectory(jobTempDir);
    } catch (error: any) {
      console.error("❌ Error in story processing pipeline:", error.message);

      // Update job status to failed
      await this.updateJobStatus(jobId, "FAILED", undefined, error.message);

      // Clean up temporary files even if there was an error
      this.cleanupTempDirectory(jobTempDir);

      throw error;
    }
  }

  /**
   * Clean up temporary directory for a job
   * @param jobTempDir - Path to job temporary directory
   */
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

  private async updateVideoStatus(
    videoId: string,
    status: JobStatus,
    jobId: string | null
  ): Promise<void> {
    await this.db.collection("videos").doc(videoId).update({
      processingStatus: status,
      currentJobId: jobId,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Update job status in Firestore
   * @param jobId - Job ID
   * @param status - New status
   * @param progress - Optional progress information
   * @param error - Optional error message
   */
  private async updateJobStatus(
    jobId: string,
    status: JobStatus,
    progress?: {
      currentStep: string;
      completedSteps: number;
      totalSteps: number;
      percentComplete: number;
    },
    error?: string
  ): Promise<void> {
    const updateData: any = {
      status,
      updatedAt: new Date().toISOString(),
    };

    if (progress) {
      updateData.progress = progress;
    }

    if (error) {
      updateData.error = error;
    }

    await this.db.collection("jobs").doc(jobId).update(updateData);
    console.log(
      `Updated job ${jobId} status to ${status}${
        progress ? ` (${progress.percentComplete}%)` : ""
      }`
    );
  }
}
