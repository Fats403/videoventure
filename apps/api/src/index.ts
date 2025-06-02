import Fastify from "fastify";
import { clerkPlugin } from "@clerk/fastify";
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";
import { Queue } from "bullmq";
import { initializeApp } from "firebase-admin/app";
import { credential } from "firebase-admin";
import { VideoService } from "./services/video.service";
import { storyboardRoutes } from "./routes/storyboard.routes";

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

// Initialize Fastify app
const fastify = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

// Set up Zod validation
fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

// Register Clerk plugin globally
fastify.register(clerkPlugin);

// Global health check
fastify.get("/healthcheck", async () => ({ status: "ok" }));

// Register routes
fastify.register(storyboardRoutes);

// Global error handling
fastify.setErrorHandler((error, request, reply) => {
  console.error("Error:", error);
  reply.status(500).send({
    error: "Internal Server Error",
    message: error.message,
  });
});

// Start server
const start = async () => {
  try {
    await fastify.listen({
      port: Number(PORT),
      host: "0.0.0.0",
    });
    console.log(`🚀 Fastify server listening on port ${PORT}`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

start();
