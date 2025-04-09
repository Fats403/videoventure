import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { Queue } from "bullmq";
import { initializeApp } from "firebase-admin/app";
import { credential } from "firebase-admin";
import { VideoService } from "./services/video.service";
import { VideoController } from "./controllers/video.controller";
import { createVideoRoutes } from "./routes/video.routes";
import { clerkMiddleware } from "@hono/clerk-auth";
import { VoiceController } from "./controllers/voice.controller";
import { createVoiceRoutes } from "./routes/voice.routes";
import { VoiceService } from "./services/voice.service";

// Load environment variables
const PORT = process.env.PORT || 6969;
const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379");

// Initialize Firebase Admin
initializeApp({
  credential: credential.applicationDefault(),
});

// Initialize BullMQ queue
const videoQueue = new Queue("video-processing", {
  connection: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  },
  defaultJobOptions: {
    attempts: 1,
    backoff: {
      type: "exponential",
      delay: 10000,
    },
    removeOnComplete: false,
    removeOnFail: true,
  },
});

// Initialize services
const videoService = new VideoService(videoQueue);
const voiceService = new VoiceService();

// Initialize controllers
const videoController = new VideoController(videoService);
const voiceController = new VoiceController(voiceService);

// Initialize Hono app
const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", clerkMiddleware());

// Health check
app.get("/health-check", (c) => c.json({ status: "ok" }));

// Register routes
createVideoRoutes(app, videoController);
createVoiceRoutes(app, voiceController);

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
