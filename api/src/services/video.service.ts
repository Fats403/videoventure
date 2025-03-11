import { nanoid } from "nanoid";
import { Queue } from "bullmq";
import { getFirestore } from "firebase-admin/firestore";
import { Job, JobStatus, JobType, VideoOrientation } from "../types";

export class VideoService {
  private db = getFirestore();
  private videoQueue: Queue;

  constructor(videoQueue: Queue) {
    this.videoQueue = videoQueue;
  }

  async createVideo(
    userId: string,
    inputConcept: string,
    maxScenes = 5,
    voiceId = "JBFqnCBsd6RMkjVDRZzb",
    orientation: VideoOrientation = "LANDSCAPE"
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
        orientation,
        maxScenes,
        voiceId,
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

  async getJobStatus(jobId: string): Promise<Job> {
    const jobDoc = await this.db.collection("jobs").doc(jobId).get();

    if (!jobDoc.exists) {
      throw new Error("Job not found");
    }

    return jobDoc.data() as Job;
  }
}
