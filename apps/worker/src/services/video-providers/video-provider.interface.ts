import { Scene } from "@video-venture/shared";

export interface VideoGenerationJob {
  sceneNumber: number;
  description: string;
  voiceover: string;
  requestId: string; // Unified ID field for all providers
  s3Uri: string;
  s3BucketName: string;
  s3Key: string;
  jobId: string;
  status: string;
  statusResponse?: any;
  error?: string;
  modelId: string; // The model ID used for generation
  providerData?: Record<string, any>; // Provider-specific data
}

export interface VideoProvider {
  // Get supported models by this provider
  getSupportedModels(): string[];

  // Generate a video for a scene
  generateSceneVideo(
    scene: Scene,
    s3BucketName: string,
    jobId: string,
    modelId: string,
    providerConfig?: Record<string, any>
  ): Promise<VideoGenerationJob>;

  // Check job status
  checkJobStatus(job: VideoGenerationJob): Promise<VideoGenerationJob>;
}
