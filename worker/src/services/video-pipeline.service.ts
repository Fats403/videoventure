import * as fs from "fs";
import * as path from "path";
import * as admin from "firebase-admin";
import { StoryboardService } from "./storyboard.service";
import {
  VideoGenerationService,
  VideoGenerationJob,
} from "./video-generation.service";
import { AudioService } from "./audio.service";
import { MusicService } from "./music.service";
import {
  VideoProcessingService,
  SceneWithAudio,
} from "./video-processing.service";
import { S3Service } from "./s3.service";

export interface JobResult {
  videoId: string;
  localVideoPath: string;
  s3VideoPath: string;
  s3StoryboardPath: string;
  visualStyle: string;
  s3MusicPath: string;
  scenes: {
    sceneNumber: number;
    videoS3Path: string;
    audioS3Path: string;
  }[];
}

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

    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Process a story into a video
   * @param storyIdea - The story concept
   * @param jobId - Unique ID for this job
   * @param maxScenes - Maximum number of scenes
   * @param voiceId - ElevenLabs voice ID
   * @returns Job result with video paths
   */
  async processStory(
    storyIdea: string,
    jobId: string,
    maxScenes = 5,
    voiceId = "JBFqnCBsd6RMkjVDRZzb"
  ): Promise<JobResult> {
    console.log(`Starting video pipeline for story: "${storyIdea}"`);

    // Create job-specific directory
    const jobTempDir = path.join(this.tempDir, jobId);
    if (!fs.existsSync(jobTempDir)) {
      fs.mkdirSync(jobTempDir, { recursive: true });
    }

    try {
      // Update job status in Firestore
      await this.updateJobStatus(jobId, "IN_PROGRESS");

      // Step 1: Generate storyboard
      const storyboard = await this.storyboardService.generateStoryboard(
        storyIdea,
        maxScenes
      );
      console.log(
        `Generated storyboard with ${storyboard.scenes.length} scenes`
      );

      // Save storyboard to file
      const storyboardPath = path.join(jobTempDir, "storyboard.txt");
      this.storyboardService.saveStoryboardToFile(storyboard, storyboardPath);

      // Upload storyboard to S3
      const storyboardS3Key = `storyboards/${jobId}/storyboard.txt`;
      await this.s3Service.uploadFile(
        storyboardPath,
        this.s3BucketName,
        storyboardS3Key
      );

      // Step 2: Generate videos for each scene in parallel
      const videoJobs = await Promise.all(
        storyboard.scenes.map((scene) =>
          this.videoGenerationService.generateSceneVideo(
            scene,
            this.s3BucketName,
            0,
            jobId
          )
        )
      );

      // Step 3: Poll for video generation completion
      const completedVideoJobs = await this.pollVideoJobs(videoJobs);

      // Step 4: Generate audio for each scene in parallel
      const audioPromises = storyboard.scenes.map((scene) =>
        this.audioService.generateVoiceOver(scene, jobId, this.tempDir, voiceId)
      );
      const audioPaths = await Promise.all(audioPromises);

      // Step 5: Download videos from S3
      const scenesWithAudio: SceneWithAudio[] = [];
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

        // Upload audio to S3
        const audioS3Key = `scenes/${jobId}/scene-${sceneNumber}/audio.mp3`;
        await this.s3Service.uploadFile(
          audioPath,
          this.s3BucketName,
          audioS3Key
        );

        // Add to scenes array
        scenesWithAudio.push({
          sceneNumber,
          videoPath,
          audioPath,
          duration: audioDuration,
          s3Key: job.s3Key,
        });
      }

      // Step 6: Combine audio with videos
      const combinedScenePaths: string[] = [];
      for (const scene of scenesWithAudio) {
        const outputPath = path.join(
          jobTempDir,
          `scene-${scene.sceneNumber}-combined.mp4`
        );
        await this.videoProcessingService.addAudioToVideo(
          scene.videoPath,
          scene.audioPath,
          outputPath
        );
        combinedScenePaths.push(outputPath);
      }

      // Step 7: Combine all scenes into one video
      const finalVideoPath = path.join(jobTempDir, "final_video.mp4");
      await this.videoProcessingService.combineVideos(
        combinedScenePaths,
        finalVideoPath
      );

      // Step 8: Generate background music
      const totalDuration = scenesWithAudio.reduce(
        (sum, scene) => sum + scene.duration,
        0
      );
      const musicPath = await this.musicService.getBackgroundMusic(
        storyIdea,
        jobId,
        this.tempDir,
        totalDuration
      );

      // Upload music to S3
      const musicS3Key = `music/${jobId}/background_music.mp3`;
      await this.s3Service.uploadFile(musicPath, this.s3BucketName, musicS3Key);

      // Step 9: Add background music to final video
      const finalVideoWithMusicPath = path.join(
        jobTempDir,
        "final_video_with_music.mp4"
      );
      await this.videoProcessingService.addMusicToVideo(
        finalVideoPath,
        musicPath,
        finalVideoWithMusicPath
      );

      // Step 10: Upload final video to S3
      const finalS3Key = `videos/${jobId}/final_video.mp4`;
      await this.s3Service.uploadFile(
        finalVideoWithMusicPath,
        this.s3BucketName,
        finalS3Key
      );

      // Create a video entry in Firestore
      const videoId = `video_${jobId}`;
      await this.db
        .collection("videos")
        .doc(videoId)
        .set({
          videoId,
          title: storyIdea,
          description: `Video created from: ${storyIdea}`,
          visibility: "PRIVATE", // Default to private
          userId: "system", // In a real app, this would be the user's ID
          jobId,
          s3Path: `s3://${this.s3BucketName}/${finalS3Key}`,
          thumbnailUrl: `https://${this.s3BucketName}.s3.amazonaws.com/${scenesWithAudio[0].s3Key}thumbnail.jpg`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          duration: totalDuration,
          views: 0,
          tags: storyIdea
            .split(" ")
            .filter((word) => word.length > 3)
            .slice(0, 5),
        });

      // Update job status to completed
      const result = {
        videoId,
        localVideoPath: finalVideoWithMusicPath,
        s3VideoPath: `s3://${this.s3BucketName}/${finalS3Key}`,
        s3StoryboardPath: `s3://${this.s3BucketName}/${storyboardS3Key}`,
        visualStyle: storyboard.visualStyle,
        s3MusicPath: `s3://${this.s3BucketName}/${musicS3Key}`,
        scenes: scenesWithAudio.map((scene) => ({
          sceneNumber: scene.sceneNumber,
          videoS3Path: `s3://${this.s3BucketName}/${scene.s3Key}`,
          audioS3Path: `s3://${this.s3BucketName}/scenes/${jobId}/scene-${scene.sceneNumber}/audio.mp3`,
        })),
      };

      await this.updateJobStatus(jobId, "COMPLETED", result);

      // Clean up temporary files
      this.cleanupTempDirectory(jobTempDir);

      return result;
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

  /**
   * Poll for video generation job completion
   * @param jobs - Array of video generation jobs
   * @returns Array of completed jobs
   */
  private async pollVideoJobs(
    jobs: VideoGenerationJob[]
  ): Promise<VideoGenerationJob[]> {
    const completedJobs: VideoGenerationJob[] = [];
    const pendingJobs = [...jobs];

    // Poll until all jobs are completed
    while (pendingJobs.length > 0) {
      // Wait 10 seconds between polls
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // Check status of all pending jobs
      for (let i = pendingJobs.length - 1; i >= 0; i--) {
        try {
          const updatedJob = await this.videoGenerationService.checkJobStatus(
            pendingJobs[i]
          );

          // If job is completed, move it to completedJobs
          if (updatedJob.status === "Completed") {
            completedJobs.push(updatedJob);
            pendingJobs.splice(i, 1);
            console.log(
              `✅ Scene ${updatedJob.sceneNumber} video generation completed`
            );
          } else {
            // Update the job in the pending array
            pendingJobs[i] = updatedJob;
          }
        } catch (error: any) {
          console.error(`Error checking job status: ${error.message}`);
          // Keep the job in pending for now, we'll retry
        }
      }

      // Log progress
      console.log(
        `Video generation progress: ${completedJobs.length}/${jobs.length} scenes completed`
      );
    }

    // Sort completed jobs by scene number
    return completedJobs.sort((a, b) => a.sceneNumber - b.sceneNumber);
  }

  /**
   * Update job status in Firestore
   * @param jobId - Job ID
   * @param status - New status
   * @param result - Optional job result
   * @param error - Optional error message
   */
  private async updateJobStatus(
    jobId: string,
    status: "QUEUED" | "IN_PROGRESS" | "COMPLETED" | "FAILED",
    result?: JobResult,
    error?: string
  ): Promise<void> {
    const updateData: any = {
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (result) {
      updateData.result = result;
    }

    if (error) {
      updateData.error = error;
    }

    await this.db.collection("jobs").doc(jobId).update(updateData);
    console.log(`Updated job ${jobId} status to ${status}`);
  }
}
