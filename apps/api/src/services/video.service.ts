import { nanoid } from "nanoid";
import { Queue } from "bullmq";
import { Firestore, getFirestore } from "firebase-admin/firestore";
import {
  Job,
  JobStatus,
  JobType,
  S3Service,
  Video,
  StoryboardResult,
  VideoVisibility,
} from "@video-venture/shared";
import { StoryboardService } from "./storyboard.service";

export class VideoService {
  private db: Firestore;
  private videoQueue: Queue;
  private s3Service: S3Service;
  private storyboardService: StoryboardService;

  constructor(videoQueue: Queue) {
    this.db = getFirestore();
    this.videoQueue = videoQueue;
    this.s3Service = new S3Service();
    this.storyboardService = new StoryboardService();
  }

  /**
   * Create a video document with storyboard based on a concept
   * @param inputConcept - User input concept
   * @param userId - User ID
   * @returns Object with videoId and storyboard
   */
  async createVideo(
    inputConcept: string,
    userId: string
  ): Promise<{ videoId: string; storyboard: StoryboardResult }> {
    console.log(`Generating storyboard for concept: "${inputConcept}"`);

    try {
      // Generate storyboard from concept
      const storyboard = await this.storyboardService.generateStoryboard(
        inputConcept
      );

      // Create a new video ID
      const videoId = nanoid();

      // Create initial video document
      await this.db
        .collection("videos")
        .doc(videoId)
        .set({
          videoId,
          userId,
          visibility: "PRIVATE" as VideoVisibility,
          duration: 0,
          views: 0,
          originalConcept: inputConcept,
          version: 1,
          storyboard,
          // Default configuration
          voiceId: "JBFqnCBsd6RMkjVDRZzb", // Default voice
          videoModel: "nova-reel", // Default video model
          providerConfig: {}, // Default empty config
          processingStatus: "PENDING" as JobStatus,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

      return { videoId, storyboard };
    } catch (error) {
      console.error("Error creating video:", error);
      throw error;
    }
  }

  /**
   * Update video details
   * @param userId - User ID
   * @param videoId - Video ID
   * @param updates - Object containing fields to update
   * @returns Updated video object
   */
  async updateVideoDetails(
    userId: string,
    videoId: string,
    updates: {
      storyboard?: StoryboardResult;
      voiceId?: string;
      videoModel?: string;
      providerConfig?: Record<string, any>;
      visibility?: VideoVisibility;
    }
  ): Promise<{ videoId: string }> {
    // Check if video exists and belongs to user
    const videoDoc = await this.db.collection("videos").doc(videoId).get();

    if (!videoDoc.exists) {
      throw new Error("Video not found");
    }

    const videoData = videoDoc.data() as Video;

    if (videoData.userId !== userId) {
      throw new Error("Unauthorized access to video");
    }

    // Only update fields that are provided
    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (updates.storyboard) {
      updateData.storyboard = updates.storyboard;
    }

    if (updates.voiceId) {
      updateData.voiceId = updates.voiceId;
    }

    if (updates.videoModel) {
      updateData.videoModel = updates.videoModel;
    }

    if (updates.providerConfig) {
      updateData.providerConfig = updates.providerConfig;
    }

    if (updates.visibility) {
      updateData.visibility = updates.visibility;
    }

    // Update the video document
    await this.db.collection("videos").doc(videoId).update(updateData);

    return { videoId };
  }

  /**
   * Start the video creation job
   * @param userId - User ID
   * @param videoId - Video ID
   * @returns Job object
   */
  async startVideoJob(userId: string, videoId: string): Promise<Job> {
    // Check if video exists and belongs to user
    const videoDoc = await this.db.collection("videos").doc(videoId).get();

    if (!videoDoc.exists) {
      throw new Error("Video not found");
    }

    const videoData = videoDoc.data() as Video;

    if (videoData.userId !== userId) {
      throw new Error("Unauthorized access to video");
    }

    // Check job status and throw error if it's already in progress

    const jobId = nanoid();

    // Create job document
    const job: Job = {
      jobId,
      videoId,
      userId,
      type: "CREATE_VIDEO" as JobType,
      status: "QUEUED" as JobStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Create the job document
    await this.db.collection("jobs").doc(jobId).set(job);

    // Update video document with current job ID and status
    await this.db
      .collection("videos")
      .doc(videoId)
      .update({
        currentJobId: jobId,
        processingStatus: "QUEUED" as JobStatus,
        updatedAt: new Date().toISOString(),
      });

    // Add job to queue
    await this.videoQueue.add("create-video", job, { jobId });

    return job;
  }

  /**
   * Get signed URLs for a video and its scenes
   * @param userId - User ID
   * @param videoId - Video ID
   * @param version - Version of the video
   * @returns Object containing signed URLs for the video and its scenes
   */
  async getVideoSignedUrls(
    userId: string,
    videoId: string,
    version: number = 1
  ) {
    // Get the video document to check if it exists
    const videoDoc = await this.db.collection("videos").doc(videoId).get();

    if (!videoDoc.exists) {
      throw new Error("Video not found");
    }

    const videoData = videoDoc.data() as Video;

    if (videoData.userId !== userId) {
      throw new Error("Unauthorized access to video");
    }

    // Generate signed URLs for the main video
    const mainVideoUrls = await this.s3Service.generateSignedUrls(
      userId,
      videoId,
      version
    );

    return {
      video: mainVideoUrls,
      expiryDate: mainVideoUrls.expiryDate,
    };
  }
}
