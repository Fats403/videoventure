import { nanoid } from "nanoid";
import { Queue } from "bullmq";
import { getFirestore } from "firebase-admin/firestore";
import {
  Job,
  JobStatus,
  JobType,
  S3Service,
  Video,
} from "@video-venture/shared";
export class VideoService {
  private db = getFirestore();
  private videoQueue: Queue;
  private s3Service: S3Service;

  constructor(videoQueue: Queue) {
    this.videoQueue = videoQueue;
    this.s3Service = new S3Service();
  }

  async createVideo(
    userId: string,
    inputConcept: string,
    maxScenes = 5,
    voiceId = "JBFqnCBsd6RMkjVDRZzb",
    videoModel = "nova-reel",
    providerConfig = {}
  ): Promise<Job> {
    const videoId = nanoid();
    const jobId = nanoid();

    // Create job document
    const job: Job = {
      jobId,
      videoId,
      userId,
      type: "CREATE_VIDEO" as JobType,
      status: "QUEUED" as JobStatus,
      params: {
        inputConcept,
        maxScenes,
        voiceId,
        videoModel,
        providerConfig,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Only create the job document initially
    await this.db.collection("jobs").doc(jobId).set(job);

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
    // Get the video document to check if it exists and is completed
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
