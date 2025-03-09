import { nanoid } from "nanoid";
import { Queue } from "bullmq";
import { getFirestore } from "firebase-admin/firestore";
import { Video, Job, JobResult } from "../types";

export class VideoService {
  private db = getFirestore();
  private videoQueue: Queue;

  constructor(videoQueue: Queue) {
    this.videoQueue = videoQueue;
  }

  async createVideo(
    userId: string,
    storyIdea: string,
    maxScenes = 5,
    voiceId = "JBFqnCBsd6RMkjVDRZzb"
  ): Promise<{ videoId: string; jobId: string; status: string }> {
    const videoId = nanoid();
    const jobId = nanoid();

    // Create initial video document
    const video: Video = {
      videoId,
      userId,
      title: storyIdea,
      description: `Video created from: ${storyIdea}`,
      visibility: "PRIVATE",
      duration: 0,
      views: 0,
      tags: storyIdea
        .split(" ")
        .filter((word: string) => word.length > 3)
        .slice(0, 5),
      videoUrl: "",
      thumbnailUrl: "",
      s3Paths: {
        video: `users/${userId}/videos/${videoId}/final.mp4`,
        thumbnail: `users/${userId}/videos/${videoId}/thumbnail.jpg`,
        music: `users/${userId}/videos/${videoId}/music.mp3`,
      },
      originalStoryIdea: storyIdea,
      visualStyle: "",
      scenes: [],
      processingStatus: "QUEUED",
      currentJobId: jobId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      urlExpiryDate: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
    };

    // Create job document
    const job: Job = {
      jobId,
      videoId,
      userId,
      type: "CREATE_VIDEO",
      status: "QUEUED",
      params: {
        storyIdea,
        maxScenes,
        voiceId,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await Promise.all([
      this.db.collection("videos").doc(videoId).set(video),
      this.db.collection("jobs").doc(jobId).set(job),
    ]);

    await this.videoQueue.add(
      "create-video",
      { jobId, videoId, userId, storyIdea, maxScenes, voiceId },
      { jobId }
    );

    return { videoId, jobId, status: "QUEUED" };
  }

  async getJobStatus(jobId: string): Promise<JobResult> {
    const jobDoc = await this.db.collection("jobs").doc(jobId).get();

    if (!jobDoc.exists) {
      throw new Error("Job not found");
    }

    return jobDoc.data() as JobResult;
  }
}
