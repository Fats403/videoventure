import { fal } from "@fal-ai/client";
import { VideoGenerationJob, VideoProvider } from "./video-provider.interface";
import * as fs from "fs";
import * as path from "path";
import {
  getProviderModelConfig,
  validateProviderConfig,
  PROVIDER_MODELS,
  S3Service,
  Scene,
} from "@video-venture/shared";

export class FalAiProvider implements VideoProvider {
  private s3Service: S3Service;
  private supportedModels: string[];

  constructor() {
    this.s3Service = new S3Service();

    // Find all models from this provider
    this.supportedModels = Object.keys(PROVIDER_MODELS).filter(
      (modelId) => PROVIDER_MODELS[modelId].provider === "fal-ai"
    );

    // Configure fal.ai client if API key is provided as environment variable
    if (process.env.FAL_API_KEY) {
      fal.config({
        credentials: process.env.FAL_API_KEY,
      });
    }
  }

  getSupportedModels(): string[] {
    return this.supportedModels;
  }

  async generateSceneVideo(
    scene: Scene,
    s3BucketName: string,
    jobId: string,
    modelId: string,
    providerConfig?: Record<string, any>
  ): Promise<VideoGenerationJob> {
    const sceneNumber = scene.sceneNumber;
    const description = scene.description;

    // Get provider configuration
    const modelConfig = getProviderModelConfig(modelId);

    // Validate and merge with default config
    const config = validateProviderConfig(modelId, providerConfig || {});

    console.log(
      `[Fal.ai ${modelConfig.name}] Generating video for Scene ${sceneNumber}...`
    );

    try {
      // Generate a path for S3
      const s3Key = `scenes/${jobId}/scene-${sceneNumber}/`;
      const s3Uri = `s3://${s3BucketName}/${s3Key}`;

      // Prepare input for fal.ai
      const input: Record<string, any> = {
        prompt: description,
      };

      // Add all config parameters to input
      Object.entries(config).forEach(([key, value]) => {
        input[key] = value;
      });

      console.log(
        `Starting video generation for Scene ${sceneNumber} with fal.ai model ${modelConfig.id}`
      );
      console.log(`Input parameters:`, input);

      // Submit the request to fal.ai
      const { request_id } = await fal.queue.submit(modelConfig.id, {
        input: input,
      });

      if (!request_id) {
        throw new Error(`No request ID returned for Scene ${sceneNumber}`);
      }

      console.log(`Received request ID ${request_id} for Scene ${sceneNumber}`);

      return {
        sceneNumber: sceneNumber,
        description: description,
        voiceover: scene.voiceover,
        requestId: request_id,
        s3Uri: s3Uri,
        s3BucketName: s3BucketName,
        s3Key: s3Key,
        jobId: jobId,
        status: "InProgress",
        modelId: modelId,
        providerData: {
          config,
        },
      };
    } catch (error: any) {
      console.error(
        `❌ [Fal.ai ${modelConfig.name}] Error generating video for Scene ${sceneNumber}:`,
        error.message
      );
      throw error;
    }
  }

  async checkJobStatus(job: VideoGenerationJob): Promise<VideoGenerationJob> {
    try {
      const requestId = job.requestId;
      const modelConfig = getProviderModelConfig(job.modelId);

      // Check status from fal.ai
      const status = await fal.queue.status(modelConfig.id, {
        requestId: requestId,
        logs: true,
      });

      // Map fal.ai status to our status format
      let mappedStatus = job.status;
      if (status.status === "COMPLETED") {
        mappedStatus = "Completed";

        // If completed, get the result and download the video
        const result = await fal.queue.result(modelConfig.id, {
          requestId: requestId,
        });

        if (result.data && result.data.video && result.data.video.url) {
          // Create a temporary directory for the video
          const tempDir = path.join(process.cwd(), "temp", job.jobId);
          if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
          }

          // Download the video from fal.ai
          const videoPath = path.join(tempDir, `scene-${job.sceneNumber}.mp4`);
          await this.downloadVideo(result.data.video.url, videoPath);

          // Upload the video to S3
          const s3Key = `${job.s3Key}scene-${job.sceneNumber}.mp4`;
          await this.s3Service.uploadFile(videoPath, job.s3BucketName, s3Key);

          // Clean up the temporary file
          fs.unlinkSync(videoPath);
        }
      } else {
        mappedStatus = "InProgress";
      }

      // Only log status changes
      if (job.status !== mappedStatus) {
        console.log(
          `[Fal.ai ${modelConfig.name}] Scene ${job.sceneNumber} - Status: ${mappedStatus}`
        );
      }

      return {
        ...job,
        status: mappedStatus,
        statusResponse: status,
      };
    } catch (error: any) {
      console.error(
        `❌ [Fal.ai] Error checking status for Scene ${job.sceneNumber}:`,
        error.message
      );
      throw error;
    }
  }

  private async downloadVideo(url: string, outputPath: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));
    console.log(`✅ [Fal.ai] Downloaded video to ${outputPath}`);
  }
}
