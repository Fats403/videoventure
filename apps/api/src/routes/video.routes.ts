import { FastifyPluginAsync } from "fastify";
import {
  FastifyZodOpenApiTypeProvider,
  FastifyZodOpenApiSchema,
} from "fastify-zod-openapi";
import { VideoController } from "../controllers/video.controller";
import { VideoService } from "../services/video.service";
import {
  StartVideoJobSchema,
  GetVideoSignedUrlsSchema,
} from "../schemas/video.schema";
import { requireAuth } from "../middlewares/auth.middleware";
import { getErrorMessage } from "../utils/getErrorMessage";
import { errorResponseSchema, jobSchema } from "@video-venture/shared";
import { z } from "zod";
import { Queue } from "bullmq";

export const videoRoutes: FastifyPluginAsync = async function (fastify) {
  // Initialize BullMQ queue for video processing
  const videoQueue = new Queue("video-processing", {
    connection: {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
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

  const videoService = new VideoService(videoQueue);
  const videoController = new VideoController(videoService);

  // Start video generation
  fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().route({
    method: "POST",
    url: "/video/generate",
    schema: {
      tags: ["Video"],
      summary: "Start video generation",
      description:
        "Queue a video generation job for a completed project. The project must have a complete breakdown with scenes and settings.",
      security: [{ bearerAuth: [] }],
      body: StartVideoJobSchema,
      response: {
        200: z.object({
          success: z.boolean(),
          job: jobSchema,
          message: z.string(),
        }),
        400: errorResponseSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    } satisfies FastifyZodOpenApiSchema,
    preHandler: requireAuth,
    handler: async (request, reply) => {
      try {
        const { videoId } = request.body;
        const userId = request.userId!;

        const job = await videoController.startVideoGeneration(videoId, userId);

        reply.send({
          success: true,
          job,
          message: "Video generation started successfully",
        });
      } catch (error: unknown) {
        const message = getErrorMessage(error);

        if (message.includes("not found") || message.includes("unauthorized")) {
          reply.status(404).send({
            statusCode: 404,
            error: "Video project not found",
            message,
          });
        } else if (message.includes("already started processing")) {
          reply.status(400).send({
            statusCode: 400,
            error: "Video already processing",
            message,
          });
        } else {
          reply.status(500).send({
            statusCode: 500,
            error: "Failed to start video generation",
            message,
          });
        }
      }
    },
  });

  // Get video signed URLs
  fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().route({
    method: "POST",
    url: "/video/urls",
    schema: {
      tags: ["Video"],
      summary: "Get video signed URLs",
      description:
        "Get signed URLs for accessing video files. Used for downloading or streaming completed videos.",
      security: [{ bearerAuth: [] }],
      body: GetVideoSignedUrlsSchema,
      response: {
        200: z.object({
          video: z.object({
            finalVideo: z.string().url(),
            expiryDate: z.string(),
          }),
          expiryDate: z.string(),
        }),
        401: errorResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    } satisfies FastifyZodOpenApiSchema,
    preHandler: requireAuth,
    handler: async (request, reply) => {
      try {
        const { videoId, version } = request.body;
        const userId = request.userId!;

        const urls = await videoController.getVideoSignedUrls(
          videoId,
          userId,
          version
        );

        reply.send(urls);
      } catch (error: unknown) {
        const message = getErrorMessage(error);

        if (message.includes("not found") || message.includes("unauthorized")) {
          reply.status(404).send({
            statusCode: 404,
            error: "Video not found",
            message,
          });
        } else {
          reply.status(500).send({
            statusCode: 500,
            error: "Failed to get video URLs",
            message,
          });
        }
      }
    },
  });
};
