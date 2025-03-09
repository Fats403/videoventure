import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { Queue } from "bullmq";
import { nanoid } from "nanoid";
import { JobResult } from "./types";
import { initializeApp } from "firebase-admin/app";
import { credential } from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { Video, Job } from "./types";
import { authenticateUser } from "./middleware/auth";

// Load environment variables
const PORT = process.env.PORT || 3000;
const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379");

// Initialize Firebase Admin
initializeApp({
  credential: credential.applicationDefault(),
});

// Initialize Firestore
const db = getFirestore();

// Initialize BullMQ queue
const videoQueue = new Queue("video-processing", {
  connection: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 10000,
    },
    removeOnComplete: false,
    removeOnFail: false,
  },
});

// Initialize Hono app
const app = new Hono<{
  Variables: {
    userId: string;
  };
}>();

// Middleware
app.use("*", logger());
app.use("*", authenticateUser);

// Health check
app.get("/", (c) => c.json({ status: "ok" }));

// Create a new video
app.post("/api/videos", async (c) => {
  try {
    const userId = c.var.userId;
    const {
      storyIdea,
      maxScenes = 5,
      voiceId = "JBFqnCBsd6RMkjVDRZzb",
    } = await c.req.json();

    if (!storyIdea) {
      return c.json({ error: "storyIdea is required" }, 400);
    }

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
      db.collection("videos").doc(videoId).set(video),
      db.collection("jobs").doc(jobId).set(job),
    ]);

    await videoQueue.add(
      "create-video",
      { jobId, videoId, userId, storyIdea, maxScenes, voiceId },
      { jobId }
    );

    return c.json({ videoId, jobId, status: "QUEUED" }, 202);
  } catch (error) {
    console.error("Error creating video:", error);
    return c.json({ error: "Failed to create video" }, 500);
  }
});

// Get job status
app.get("/api/videos/:jobId", async (c) => {
  try {
    const jobId = c.req.param("jobId");

    // Get job from Firestore
    const jobDoc = await db.collection("jobs").doc(jobId).get();

    if (!jobDoc.exists) {
      return c.json({ error: "Job not found" }, 404);
    }

    const job = jobDoc.data() as JobResult;

    // Format response
    return c.json(job);
  } catch (error) {
    console.error("Error getting job:", error);
    return c.json({ error: "Failed to get job status" }, 500);
  }
});

// Error handling
app.onError((err, c) => {
  console.error("Error:", err);
  return c.json({ error: "Internal Server Error" }, 500);
});

// Start server
console.log(`Starting API server on port ${PORT}...`);
serve({
  fetch: app.fetch,
  port: Number(PORT),
});
