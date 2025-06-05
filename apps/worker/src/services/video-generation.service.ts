import { fal } from "@fal-ai/client";
import * as fs from "fs";
import * as path from "path";
import { S3Service } from "@video-venture/shared/server";
import { getFalModel } from "@video-venture/shared";
import type { Scene, VideoModel, SettingsData } from "@video-venture/shared";

interface VideoGenerationJob {
  sceneId: string;
  sceneOrder: number;
  requestId: string;
  s3BucketName: string;
  s3Key: string;
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  modelId: VideoModel;
  error?: string;
}

export class VideoGenerationService {
  private s3Service: S3Service;

  constructor() {
    this.s3Service = new S3Service();

    if (process.env.FAL_API_KEY) {
      fal.config({
        credentials: process.env.FAL_API_KEY,
      });
    } else {
      throw new Error("FAL_API_KEY environment variable is required");
    }
  }

  /**
   * Generate video for a scene using image-to-video
   */
  async generateSceneVideo(
    scene: Scene,
    settings: SettingsData,
    jobId: string,
    s3BucketName: string
  ): Promise<VideoGenerationJob> {
    const { videoModel, aspectRatio } = settings;
    const falModel = getFalModel(videoModel);

    console.log(
      `🎬 Generating video for scene ${scene.order + 1} using ${falModel.name}`
    );

    try {
      // Build the input for the fal.ai model
      const input = {
        prompt: scene.imageDescription,
        image_url: scene.imageUrl,
        ...falModel.defaultConfig,
        aspect_ratio: aspectRatio,
      };

      // Generate S3 path
      const s3Key = `scenes/${jobId}/scene-${scene.order + 1}/video.mp4`;

      console.log(`📤 Submitting to Fal.ai:`, {
        model: falModel.id,
        prompt: scene.imageDescription,
        image_url: scene.imageUrl,
      });

      // Submit to Fal.ai
      const { request_id } = await fal.queue.submit(falModel.id, { input });

      if (!request_id) {
        throw new Error(`No request ID returned for scene ${scene.order + 1}`);
      }

      console.log(`✅ Received request ID: ${request_id}`);

      return {
        sceneId: scene.id,
        sceneOrder: scene.order,
        requestId: request_id,
        s3BucketName,
        s3Key,
        jobId,
        status: "processing",
        modelId: videoModel,
      };
    } catch (error: any) {
      console.error(
        `❌ Error generating video for scene ${scene.order + 1}:`,
        error.message
      );
      throw new Error(`Failed to generate video: ${error.message}`);
    }
  }

  /**
   * Check status of video generation job
   */
  async checkJobStatus(job: VideoGenerationJob): Promise<VideoGenerationJob> {
    try {
      const falModel = getFalModel(job.modelId);

      const status = await fal.queue.status(falModel.id, {
        requestId: job.requestId,
        logs: false,
      });

      let updatedJob = { ...job };

      if (status.status === "COMPLETED") {
        updatedJob.status = "completed";

        const result = await fal.queue.result(falModel.id, {
          requestId: job.requestId,
        });

        if (result.data?.video?.url) {
          await this.downloadAndUploadVideo(result.data.video.url, job);
          console.log(
            `✅ Scene ${job.sceneOrder + 1} video completed and uploaded`
          );
        } else {
          throw new Error("No video URL in result");
        }
      } else if (
        status.status === "IN_PROGRESS" ||
        status.status === "IN_QUEUE"
      ) {
        updatedJob.status = "processing";
        // Log only status changes to avoid spam
        if (job.status !== "processing") {
          console.log(
            `🔄 Scene ${job.sceneOrder + 1} status: ${status.status}`
          );
        }
      }

      return updatedJob;
    } catch (error: any) {
      // Fal.ai throws errors for failed jobs
      console.error(`❌ Scene ${job.sceneOrder + 1} failed:`, error.message);
      return {
        ...job,
        status: "failed",
        error: error.message,
      };
    }
  }

  /**
   * Poll for completion of all video jobs
   */
  async pollVideoJobs(
    jobs: VideoGenerationJob[],
    onProgress?: (progress: number) => Promise<void>
  ): Promise<VideoGenerationJob[]> {
    const completedJobs: VideoGenerationJob[] = [];
    let pendingJobs = [...jobs];

    console.log(`🔄 Polling ${jobs.length} video generation jobs...`);

    while (pendingJobs.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 10000));

      const statusChecks = pendingJobs.map((job) => this.checkJobStatus(job));
      const updatedJobs = await Promise.allSettled(statusChecks);

      for (let i = pendingJobs.length - 1; i >= 0; i--) {
        const result = updatedJobs[i];

        if (result.status === "fulfilled") {
          const updatedJob = result.value;

          if (
            updatedJob.status === "completed" ||
            updatedJob.status === "failed"
          ) {
            completedJobs.push(updatedJob);
            pendingJobs.splice(i, 1);
          } else {
            pendingJobs[i] = updatedJob;
          }
        }
      }

      const progress = Math.round((completedJobs.length / jobs.length) * 100);
      console.log(
        `📊 Video generation progress: ${completedJobs.length}/${jobs.length} (${progress}%)`
      );

      if (onProgress) {
        await onProgress(progress);
      }
    }

    return completedJobs.sort((a, b) => a.sceneOrder - b.sceneOrder);
  }

  /**
   * Download video from Fal.ai and upload to S3
   */
  private async downloadAndUploadVideo(
    videoUrl: string,
    job: VideoGenerationJob
  ): Promise<void> {
    const tempDir = path.join(process.cwd(), "temp", job.jobId);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempVideoPath = path.join(tempDir, `scene-${job.sceneOrder + 1}.mp4`);

    try {
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      fs.writeFileSync(tempVideoPath, Buffer.from(buffer));

      await this.s3Service.uploadFile(
        tempVideoPath,
        job.s3BucketName,
        job.s3Key
      );
      fs.unlinkSync(tempVideoPath);
    } catch (error: any) {
      console.error(`Error downloading/uploading video:`, error.message);
      throw error;
    }
  }
}
