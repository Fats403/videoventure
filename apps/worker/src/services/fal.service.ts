import { fal } from "@fal-ai/client";
import { OpenAI } from "openai";
import { getFalVideoModel, getFalMusicModel } from "@video-venture/shared";
import type {
  VideoModel,
  Scene,
  SettingsData,
  FAL_MUSIC_MODELS,
} from "@video-venture/shared";
import { SupabaseStorageService } from "@video-venture/shared/server";
import * as fs from "fs";
import * as path from "path";

export interface VideoGenerationJob {
  sceneId: string;
  sceneOrder: number;
  requestId: string;
  storageKey: string;
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  modelId: VideoModel;
  error?: string;
}

export interface MusicGenerationJob {
  requestId: string;
  storageKey: string;
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  modelId: string;
  error?: string;
}

export class FalService {
  private openai: OpenAI;
  private storageService: SupabaseStorageService;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.storageService = new SupabaseStorageService();

    if (process.env.FAL_API_KEY) {
      fal.config({
        credentials: process.env.FAL_API_KEY,
      });
      console.log("Fal.ai client configured.");
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
    projectId: string,
    jobId: string,
    userId: string
  ): Promise<VideoGenerationJob> {
    const { videoModel, aspectRatio } = settings;
    const falModel = getFalVideoModel(videoModel);

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

      // Generate storage path
      const storageKey = this.storageService.getSceneVideoPath(
        userId,
        projectId,
        scene.order + 1
      );

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
        storageKey,
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
   * Generate music using Fal.ai
   */
  async generateMusic(
    musicDescription: string,
    duration: number,
    jobId: string,
    userId: string,
    projectId: string,
    musicModel: string = "cassette-ai"
  ): Promise<MusicGenerationJob> {
    const falModel = getFalMusicModel(
      musicModel as keyof typeof FAL_MUSIC_MODELS
    );

    console.log(`🎵 Generating music using ${falModel.name} for ${duration}s`);

    try {
      const optimizedPrompt = await this.optimizeMusicPrompt(musicDescription);

      const input = {
        prompt: optimizedPrompt,
        duration: duration,
        ...falModel.defaultConfig,
      };

      const storageKey = this.storageService.getMusicPath(userId, projectId);

      console.log(`📤 Submitting music to Fal.ai:`, {
        model: falModel.id,
        prompt: optimizedPrompt,
        duration,
      });

      const { request_id } = await fal.queue.submit(falModel.id, { input });

      if (!request_id) {
        throw new Error("No request ID returned for music generation");
      }

      console.log(`✅ Received music request ID: ${request_id}`);

      return {
        requestId: request_id,
        storageKey,
        jobId,
        status: "processing",
        modelId: musicModel,
      };
    } catch (error: any) {
      console.error(`❌ Error generating music:`, error.message);
      throw new Error(`Failed to generate music: ${error.message}`);
    }
  }

  /**
   * Poll video jobs until completion with progress callback
   */
  async pollVideoJobs(
    jobs: VideoGenerationJob[],
    onProgress?: (progress: number) => Promise<void>
  ): Promise<VideoGenerationJob[]> {
    console.log(`⏳ Polling ${jobs.length} video generation jobs...`);

    const maxAttempts = 120; // 20 minutes max
    const pollInterval = 10000; // 10 seconds
    let attempts = 0;
    let completedCount = 0;

    while (completedCount < jobs.length && attempts < maxAttempts) {
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      for (let i = 0; i < jobs.length; i++) {
        if (jobs[i].status === "processing") {
          jobs[i] = await this.checkVideoJobStatus(jobs[i]);

          if (jobs[i].status === "completed") {
            completedCount++;
            console.log(`✅ Video ${i + 1}/${jobs.length} completed`);
          } else if (jobs[i].status === "failed") {
            throw new Error(
              `Video generation failed for scene ${i + 1}: ${jobs[i].error}`
            );
          }
        }
      }

      // Call progress callback if provided
      if (onProgress) {
        const progress = completedCount / jobs.length;
        await onProgress(progress);
      }
    }

    if (completedCount < jobs.length) {
      const failedJobs = jobs.filter((job) => job.status !== "completed");
      throw new Error(
        `Video generation timed out. ${failedJobs.length} jobs incomplete.`
      );
    }

    console.log(`✅ All ${jobs.length} video jobs completed`);
    return jobs;
  }

  /**
   * Poll music job until completion with progress callback
   */
  async pollMusicJob(
    job: MusicGenerationJob,
    onProgress?: (progress: number) => Promise<void>
  ): Promise<MusicGenerationJob> {
    console.log(`⏳ Polling music generation job...`);

    const maxAttempts = 120; // 20 minutes max
    const pollInterval = 10000; // 10 seconds
    let attempts = 0;

    while (job.status === "processing" && attempts < maxAttempts) {
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      job = await this.checkMusicJobStatus(job);

      if (job.status === "completed") {
        console.log(`✅ Music generation completed`);
        break;
      } else if (job.status === "failed") {
        throw new Error(`Music generation failed: ${job.error}`);
      }

      // Call progress callback if provided (music is binary - 0 or 1)
      if (onProgress) {
        await onProgress(0.5); // Show some progress while waiting
      }
    }

    if (job.status !== "completed") {
      throw new Error("Music generation timed out");
    }

    // Final progress callback
    if (onProgress) {
      await onProgress(1.0);
    }

    return job;
  }

  /**
   * Check status of video generation job
   */
  async checkVideoJobStatus(
    job: VideoGenerationJob
  ): Promise<VideoGenerationJob> {
    try {
      const falModel = getFalVideoModel(job.modelId);

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
          await this.downloadAndUploadVideo(
            result.data.video.url,
            job.storageKey
          );
        } else {
          throw new Error("No video URL in result");
        }
      } else if (
        status.status === "IN_PROGRESS" ||
        status.status === "IN_QUEUE"
      ) {
        updatedJob.status = "processing";
      }

      return updatedJob;
    } catch (error: any) {
      console.error(`❌ Scene ${job.sceneOrder + 1} failed:`, error.message);
      return {
        ...job,
        status: "failed",
        error: error.message,
      };
    }
  }

  /**
   * Check status of music generation job
   */
  async checkMusicJobStatus(
    job: MusicGenerationJob
  ): Promise<MusicGenerationJob> {
    try {
      const falModel = getFalMusicModel(
        job.modelId as keyof typeof import("@video-venture/shared").FAL_MUSIC_MODELS
      );

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

        if (result.data?.audio_file?.url) {
          await this.downloadAndUploadMusic(
            result.data.audio_file.url,
            job.storageKey
          );
        } else {
          throw new Error("No audio URL in result");
        }
      } else if (
        status.status === "IN_PROGRESS" ||
        status.status === "IN_QUEUE"
      ) {
        updatedJob.status = "processing";
      }

      return updatedJob;
    } catch (error: any) {
      console.error(`❌ Music generation failed:`, error.message);
      return {
        ...job,
        status: "failed",
        error: error.message,
      };
    }
  }

  /**
   * Download file from URL to local path
   */
  async downloadFile(url: string, outputPath: string): Promise<void> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();

      // Ensure directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(outputPath, Buffer.from(buffer));
      console.log(`✅ Downloaded file to: ${outputPath}`);
    } catch (error: any) {
      console.error(`❌ Error downloading file:`, error.message);
      throw error;
    }
  }

  /**
   * Get public URL for a storage key
   */
  getPublicUrl(storageKey: string): string {
    return this.storageService.getPublicUrl(storageKey);
  }

  /**
   * Download video from Fal.ai and upload to Supabase
   */
  private async downloadAndUploadVideo(
    videoUrl: string,
    storageKey: string
  ): Promise<void> {
    try {
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      await this.storageService.uploadBuffer(buffer, storageKey, "video/mp4");

      console.log(`✅ Uploaded video to Supabase: ${storageKey}`);
    } catch (error: any) {
      console.error(`Error downloading/uploading video:`, error.message);
      throw error;
    }
  }

  /**
   * Download music from Fal.ai and upload to Supabase
   */
  private async downloadAndUploadMusic(
    audioUrl: string,
    storageKey: string
  ): Promise<void> {
    try {
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to download audio: ${response.statusText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      await this.storageService.uploadBuffer(buffer, storageKey, "audio/wav");

      console.log(`✅ Uploaded music to Supabase: ${storageKey}`);
    } catch (error: any) {
      console.error(`Error downloading/uploading music:`, error.message);
      throw error;
    }
  }

  /**
   * Convert detailed music description to optimized prompt for AI generation
   */
  private async optimizeMusicPrompt(musicDescription: string): Promise<string> {
    try {
      const systemPrompt = `Convert a detailed music description into a concise prompt for AI music generation.

Guidelines:
1. Focus on mood, genre, tempo, and key instruments
2. Keep under 150 characters
3. Remove narrative elements, focus on musical qualities
4. Examples: 
   - "Uplifting cinematic orchestra, adventurous theme, fast tempo"
   - "Dark electronic synthwave, 80s retro feel, driving bassline, 120 BPM"
   - "Relaxing lofi hip-hop beat, mellow piano, rainy day vibe"`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Convert this to a music prompt: "${musicDescription}"`,
          },
        ],
        temperature: 0.7,
        max_tokens: 80,
      });

      const optimizedPrompt = response.choices?.[0].message.content?.trim();
      if (!optimizedPrompt) {
        throw new Error("Failed to optimize music prompt");
      }

      console.log(`🎵 Optimized music prompt: "${optimizedPrompt}"`);
      return optimizedPrompt;
    } catch (error: any) {
      console.error(`Error optimizing music prompt: ${error.message}`);
      // Fallback to original description if optimization fails
      return musicDescription.slice(0, 150);
    }
  }
}
