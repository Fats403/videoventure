import { nanoid } from "nanoid";
import { Queue } from "bullmq";
import { Firestore, getFirestore } from "firebase-admin/firestore";
import {
  Job,
  VideoStatus,
  JobType,
  S3Service,
  Video,
} from "@video-venture/shared";

export class VideoService {
  private db: Firestore;
  private videoQueue: Queue;
  private s3Service: S3Service;

  constructor(videoQueue: Queue) {
    this.db = getFirestore();
    this.videoQueue = videoQueue;
    this.s3Service = new S3Service();
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

    if (videoData.status !== "CREATED") {
      throw new Error("Video has already started processing");
    }

    const jobId = nanoid();

    // Create job document
    const job: Job = {
      jobId,
      videoId,
      userId,
      type: "CREATE_VIDEO" as JobType,
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
        status: "QUEUED" as VideoStatus,
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
