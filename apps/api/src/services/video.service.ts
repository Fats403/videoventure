import { nanoid } from "nanoid";
import { Queue } from "bullmq";
import { Job, JobType, VideoHistory } from "@video-venture/shared";
import {
  SupabaseStorageService, // Updated to use Supabase
  videoProjects,
  eq,
  and,
} from "@video-venture/shared/server";
import { db } from "../db";

export class VideoService {
  private videoQueue: Queue;
  private storageService: SupabaseStorageService; // Updated to use Supabase

  constructor(videoQueue: Queue) {
    this.videoQueue = videoQueue;
    this.storageService = new SupabaseStorageService(); // Updated to use Supabase
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
      throw new Error("Video project not found or unauthorized access");
    }

    if (videoProject.status === "generating") {
      throw new Error("Video has already started processing");
    }

    // Validate project is ready for video generation
    if (!videoProject.breakdown || !videoProject.settings) {
      throw new Error(
        "Project must have complete breakdown and settings before generating video"
      );
    }

    if (
      !videoProject.breakdown.scenes ||
      videoProject.breakdown.scenes.length === 0
    ) {
      throw new Error("Project must have at least one scene to generate video");
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
    await this.videoQueue.add("create-video", job, {
      jobId,
      delay: 0, // Start immediately
      priority: 1, // High priority
    });

    console.log(
      `🚀 Video generation job queued for project ${videoId} with jobId ${jobId}`
    );

    return job;
  }

  /**
   * Get video file URLs from Supabase
   * @param userId - User ID
   * @param videoId - Video ID
   * @param version - Version of the video
   * @returns Object containing URLs for the video
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
      throw new Error("Video project not found or unauthorized access");
    }

    if (videoProject.status !== "completed") {
      throw new Error("Video is not yet completed");
    }

    // Generate signed URLs for the main video from Supabase
    const videoStorageKey = `users/${userId}/projects/${videoId}/video/final_v${version}.mp4`;
    const videoUrl = `https://${process.env.SUPABASE_STORAGE_URL}/${videoStorageKey}`;
    // const videoUrl = await this.storageService.getSignedUrl(
    //   videoStorageKey,
    //   3600
    // ); // 1 hour expiry

    const expiryDate = new Date(Date.now() + 3600 * 1000).toISOString(); // 1 hour from now

    return {
      video: {
        finalVideo: videoUrl,
        expiryDate,
      },
      expiryDate,
    };
  }

  /**
   * Get project status and progress
   * @param userId - User ID
   * @param videoId - Video ID
   * @returns Project status information
   */
  async getProjectStatus(userId: string, videoId: string) {
    const [videoProject] = await db
      .select()
      .from(videoProjects)
      .where(
        and(eq(videoProjects.id, videoId), eq(videoProjects.userId, userId))
      )
      .limit(1);

    if (!videoProject) {
      throw new Error("Video project not found or unauthorized access");
    }

    return {
      status: videoProject.status,
      currentJobId: videoProject.currentJobId,
      history: videoProject.history,
      updatedAt: videoProject.updatedAt,
    };
  }
}
