import { nanoid } from "nanoid";
import { Queue } from "bullmq";
import { Job, JobType, VideoHistory } from "@video-venture/shared";
import {
  S3Service,
  videoProjects,
  eq,
  and,
} from "@video-venture/shared/server";
import { db } from "../db";

export class VideoService {
  private videoQueue: Queue;
  private s3Service: S3Service;

  constructor(videoQueue: Queue) {
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
    const [videoProject] = await db
      .select()
      .from(videoProjects)
      .where(
        and(eq(videoProjects.id, videoId), eq(videoProjects.userId, userId))
      )
      .limit(1);

    if (!videoProject) {
      throw new Error("Video not found or unauthorized access");
    }

    if (videoProject.status === "generating") {
      throw new Error("Video has already started processing");
    }

    const jobId = nanoid();

    // Create job object
    const job: Job = {
      jobId,
      videoId,
      userId,
      type: "CREATE_VIDEO" as JobType,
    };

    // Create history entry
    const historyEntry: VideoHistory = {
      jobId,
      status: "QUEUED",
      type: "CREATE_VIDEO",
      createdAt: new Date(),
      progress: 0,
    };

    // Update video project with job info
    await db
      .update(videoProjects)
      .set({
        status: "generating",
        currentJobId: jobId,
        history: {
          ...(videoProject.history || {}),
          [jobId]: historyEntry,
        },
        updatedAt: new Date(),
      })
      .where(eq(videoProjects.id, videoId));

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
    // Check if video exists and belongs to user
    const [videoProject] = await db
      .select()
      .from(videoProjects)
      .where(
        and(eq(videoProjects.id, videoId), eq(videoProjects.userId, userId))
      )
      .limit(1);

    if (!videoProject) {
      throw new Error("Video not found or unauthorized access");
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
