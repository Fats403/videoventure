import {
  BedrockRuntimeClient,
  StartAsyncInvokeCommand,
  GetAsyncInvokeCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { Scene } from "./storyboard.service";

export interface VideoGenerationJob {
  sceneNumber: number;
  description: string;
  voiceover: string;
  invocationArn: string;
  s3Uri: string;
  s3BucketName: string;
  s3Key: string;
  jobId: string;
  status: string;
  statusResponse?: any;
  error?: string;
}

export class VideoGenerationService {
  private bedrockClient: BedrockRuntimeClient;

  constructor() {
    this.bedrockClient = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || "us-east-1",
    });
  }

  /**
   * Generate a video for a single scene
   * @param scene - Scene object with visual description
   * @param s3BucketName - S3 bucket to store the video
   * @param seed - Optional seed for video generation
   * @param jobId - Unique ID for this job
   * @returns Information about the generated video
   */
  async generateSceneVideo(
    scene: Scene,
    s3BucketName: string,
    seed = 0,
    jobId: string
  ): Promise<VideoGenerationJob> {
    const sceneNumber = scene.scene_number;
    const description = scene.visual_description;

    console.log(`Generating video for Scene ${sceneNumber}...`);

    try {
      // Using Amazon Nova Reel model for video generation
      const modelId = "amazon.nova-reel-v1:0";

      // Create model input object
      const modelInput = {
        taskType: "TEXT_VIDEO",
        textToVideoParams: {
          text: description,
        },
        videoGenerationConfig: {
          durationSeconds: 6,
          fps: 24,
          dimension: "1280x720",
          seed: seed,
        },
      };

      // Generate a path using the jobId and scene number
      const s3Key = `scenes/${jobId}/scene-${sceneNumber}/`;
      const s3Uri = `s3://${s3BucketName}/${s3Key}`;

      // Define the request parameters
      const params = {
        modelId: modelId,
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
        invocationArn: invocationArn,
        s3Uri: s3Uri,
        s3BucketName: s3BucketName,
        s3Key: s3Key,
        jobId: jobId,
        status: "InProgress",
      };
    } catch (error: any) {
      console.error(
        `❌ Error generating video for Scene ${sceneNumber}:`,
        error.message
      );
      throw error;
    }
  }

  /**
   * Check the status of a video generation job
   * @param job - Job information object
   * @returns Updated job information
   */
  async checkJobStatus(job: VideoGenerationJob): Promise<VideoGenerationJob> {
    try {
      const statusCommand = new GetAsyncInvokeCommand({
        invocationArn: job.invocationArn,
      });

      const statusResponse = await this.bedrockClient.send(statusCommand);
      const newStatus = statusResponse.status;

      // Only log status changes
      if (job.status !== newStatus) {
        console.log(`Scene ${job.sceneNumber} - Status: ${newStatus}`);
      }

      if (newStatus === "Failed") {
        throw new Error(
          `Job failed: ${statusResponse.failureMessage || "Unknown reason"}`
        );
      }

      return {
        ...job,
        status: newStatus ?? "",
        statusResponse: statusResponse,
      };
    } catch (error: any) {
      console.error(
        `❌ Error checking status for Scene ${job.sceneNumber}:`,
        error.message
      );
      throw error;
    }
  }
}
