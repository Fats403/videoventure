import {
  BedrockRuntimeClient,
  StartAsyncInvokeCommand,
  GetAsyncInvokeCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { Scene } from "../storyboard.service";
import { VideoGenerationJob, VideoProvider } from "./video-provider.interface";
import {
  getProviderModelConfig,
  validateProviderConfig,
  PROVIDER_MODELS,
} from "@video-venture/shared";

export class AmazonProvider implements VideoProvider {
  private bedrockClient: BedrockRuntimeClient;
  private supportedModels: string[];

  constructor() {
    this.bedrockClient = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || "us-east-1",
    });

    // Find all models from this provider
    this.supportedModels = Object.keys(PROVIDER_MODELS).filter(
      (modelId) => PROVIDER_MODELS[modelId].provider === "amazon"
    );
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
    const sceneNumber = scene.scene_number;
    const description = scene.visual_description;

    // Get provider configuration
    const modelConfig = getProviderModelConfig(modelId);

    // Validate and merge with default config
    const config = validateProviderConfig(modelId, providerConfig || {});

    console.log(
      `[Amazon ${modelConfig.name}] Generating video for Scene ${sceneNumber}...`
    );

    try {
      // Using Amazon model for video generation
      const awsModelId = modelConfig.id;

      // Create model input object
      const modelInput = {
        taskType: "TEXT_VIDEO",
        textToVideoParams: {
          text: description,
        },
        videoGenerationConfig: {
          durationSeconds: modelConfig.capabilities.supportedDurations[0],
          fps: 24,
          dimension: modelConfig.capabilities.supportedResolutions[0],
          seed: config.seed,
        },
      };

      // Generate a path using the jobId and scene number
      const s3Key = `scenes/${jobId}/scene-${sceneNumber}/`;
      const s3Uri = `s3://${s3BucketName}/${s3Key}`;

      // Define the request parameters
      const params = {
        modelId: awsModelId,
        modelInput: modelInput,
        outputDataConfig: {
          s3OutputDataConfig: {
            s3Uri: s3Uri,
          },
        },
      };

      console.log(`Starting video generation for Scene ${sceneNumber}`);

      const command = new StartAsyncInvokeCommand(params);
      const response = await this.bedrockClient.send(command);

      const invocationArn = response.invocationArn;
      if (!invocationArn) {
        throw new Error(`No invocation ARN returned for Scene ${sceneNumber}`);
      }

      return {
        sceneNumber: sceneNumber,
        description: description,
        voiceover: scene.voiceover,
        requestId: invocationArn,
        s3Uri: s3Uri,
        s3BucketName: s3BucketName,
        s3Key: s3Key,
        jobId: jobId,
        status: "InProgress",
        modelId: modelId,
        providerData: {
          invocationArn,
          config,
        },
      };
    } catch (error: any) {
      console.error(
        `❌ [Amazon ${modelConfig.name}] Error generating video for Scene ${sceneNumber}:`,
        error.message
      );
      throw error;
    }
  }

  async checkJobStatus(job: VideoGenerationJob): Promise<VideoGenerationJob> {
    try {
      const invocationArn = job.requestId;
      const modelConfig = getProviderModelConfig(job.modelId);

      const statusCommand = new GetAsyncInvokeCommand({
        invocationArn: invocationArn,
      });

      const statusResponse = await this.bedrockClient.send(statusCommand);
      const newStatus = statusResponse.status;

      // Only log status changes
      if (job.status !== newStatus) {
        console.log(
          `[Amazon ${modelConfig.name}] Scene ${job.sceneNumber} - Status: ${newStatus}`
        );
      }

      if (newStatus === "Failed") {
        throw new Error(
          `Job failed: ${statusResponse.failureMessage || "Unknown reason"}`
        );
      }

      return {
        ...job,
        status: newStatus === "Completed" ? "Completed" : "InProgress",
        statusResponse: statusResponse,
      };
    } catch (error: any) {
      console.error(
        `❌ [Amazon] Error checking status for Scene ${job.sceneNumber}:`,
        error.message
      );
      throw error;
    }
  }
}
