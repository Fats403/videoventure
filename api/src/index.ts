import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { Queue } from "bullmq";
import { nanoid } from "nanoid";
import { JobResult } from "./types";
import { initializeApp } from "firebase-admin/app";
import { credential } from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

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
const app = new Hono();

// Middleware
app.use("*", logger());

// Health check
app.get("/", (c) => c.json({ status: "ok" }));

// Create a new video job
app.post("/api/videos", async (c) => {
  try {
    const {
      storyIdea,
      maxScenes = 5,
      voiceId = "JBFqnCBsd6RMkjVDRZzb",
    } = await c.req.json();

    if (!storyIdea) {
      return c.json({ error: "storyIdea is required" }, 400);
    }

    // Generate a unique job ID
    const jobId = nanoid();

    // Create job record in Firestore
    await db.collection("jobs").doc(jobId).set({
      jobId,
      storyIdea,
      maxScenes,
      voiceId,
      status: "QUEUED",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Add job to BullMQ queue
    await videoQueue.add(
      "create-video",
      {
        jobId,
        storyIdea,
        maxScenes,
        voiceId,
      },
      {
        jobId: jobId,
      }
    );

    return c.json(
      {
        jobId,
        status: "QUEUED",
        message: "Your video creation job has been queued",
      },
      202
    );
  } catch (error) {
    console.error("Error submitting job:", error);
    return c.json({ error: "Failed to submit job" }, 500);
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
