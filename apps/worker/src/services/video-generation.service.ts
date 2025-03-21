import { Scene } from "./storyboard.service";
import {
  VideoGenerationJob,
  VideoProvider,
} from "./video-providers/video-provider.interface";
import { AmazonProvider } from "./video-providers/amazon.provider";
import { FalAiProvider } from "./video-providers/fal-ai.provider";
import { PROVIDER_MODELS } from "@video-venture/shared";

export class VideoGenerationService {
  private providers: Map<string, VideoProvider>;
  private modelToProvider: Map<string, string>;

  constructor() {
    // Initialize providers
    this.providers = new Map();
    this.providers.set("amazon", new AmazonProvider());
    this.providers.set("fal-ai", new FalAiProvider());

    // Create a mapping from model ID to provider
    this.modelToProvider = new Map();
    Object.entries(PROVIDER_MODELS).forEach(([modelId, config]) => {
      this.modelToProvider.set(modelId, config.provider);
    });
  }

  /**
   * Get all available video models with their configurations
   * @returns Array of model configurations
   */
  getAvailableModels() {
    return Object.entries(PROVIDER_MODELS).map(([id, config]) => ({
      id,
      name: config.name,
      description: config.description,
      provider: config.provider,
      capabilities: config.capabilities,
      defaultConfig: config.defaultConfig,
    }));
  }

  /**
   * Get a specific provider for a model
   * @param modelId - Model ID
   * @returns Video provider instance
   */
  private getProviderForModel(modelId: string): VideoProvider {
    const providerId = this.modelToProvider.get(modelId);
    if (!providerId) {
      throw new Error(`No provider found for model '${modelId}'`);
    }

    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider '${providerId}' not found`);
    }

    return provider;
  }

  /**
   * Generate a video for a single scene using the specified model
   * @param scene - Scene object with visual description
   * @param s3BucketName - S3 bucket to store the video
   * @param modelId - ID of the video model to use
   * @param jobId - Unique ID for this job
   * @param providerConfig - Provider-specific configuration
   * @returns Information about the generated video
   */
  async generateSceneVideo(
    scene: Scene,
    s3BucketName: string,
    modelId: string,
    jobId: string,
    providerConfig?: Record<string, any>
  ): Promise<VideoGenerationJob> {
    const provider = this.getProviderForModel(modelId);
    return provider.generateSceneVideo(
      scene,
      s3BucketName,
      jobId,
      modelId,
      providerConfig
    );
  }

  /**
   * Check the status of a video generation job
   * @param job - Job information object
   * @returns Updated job information
   */
  async checkJobStatus(job: VideoGenerationJob): Promise<VideoGenerationJob> {
    const provider = this.getProviderForModel(job.modelId);
    return provider.checkJobStatus(job);
  }

  /**
   * Poll for video generation job completion
   * @param jobs - Array of video generation jobs
   * @param jobId - Current job ID for progress updates
   * @param updateProgressCallback - Callback function to update progress
   * @returns Array of completed jobs
   */
  async pollVideoJobs(
    jobs: VideoGenerationJob[],
    jobId: string,
    updateProgressCallback?: (progress: number) => Promise<void>
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
          const updatedJob = await this.checkJobStatus(pendingJobs[i]);

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
      const progress = Math.round((completedJobs.length / jobs.length) * 100);
      console.log(
        `Video generation progress: ${completedJobs.length}/${jobs.length} scenes completed (${progress}%)`
      );

      // Call the progress callback if provided
      if (updateProgressCallback) {
        await updateProgressCallback(progress);
      }
    }

    // Sort completed jobs by scene number
    return completedJobs.sort((a, b) => a.sceneNumber - b.sceneNumber);
  }
}
