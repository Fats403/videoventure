import * as dotenv from "dotenv";
import { Worker } from "bullmq";
import { VideoPipelineService } from "./services/video-pipeline.service";
import { Job } from "@video-venture/shared";

// Load environment variables
dotenv.config();

// Initialize the video pipeline service
const videoPipelineService = new VideoPipelineService();

// Configure Redis connection
const redisConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

// Define worker concurrency
const concurrency = parseInt(process.env.WORKER_CONCURRENCY || "1");

// Create a worker to process video creation jobs
const worker = new Worker(
  "video-processing",
  async (job) => {
    console.log(`Processing job ${job.id}: ${job.name}`);

    try {
      // Properly type the job data
      const jobData = job.data as Job;
      const { jobId, videoId, userId } = jobData;

      // Updated method name
      await videoPipelineService.processVideo({
        jobId,
        videoId,
        userId,
      });

      console.log(`✅ Job ${jobId} completed successfully`);
    } catch (error: any) {
      console.error(`❌ Job ${job.id} failed: ${error.message}`);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency,
  }
);

// Log worker events
worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on("failed", (job, error) => {
  console.error(`Job ${job?.id} failed: ${error.message}`);
});

console.log(`Video pipeline worker started with concurrency ${concurrency}`);
