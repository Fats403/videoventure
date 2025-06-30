import { FastifyPluginAsync } from "fastify";
import {
  FastifyZodOpenApiTypeProvider,
  FastifyZodOpenApiSchema,
} from "fastify-zod-openapi";
import { StoryboardController } from "../controllers/storyboard.controller";
import { StoryboardService } from "../services/storyboard.service";
import {
  StoryboardRequestSchema,
  StoryboardCreationResponseSchema,
  StoryboardResponseSchema,
  SceneBreakdownRequestSchema,
  SceneBreakdownResponseSchema,
} from "../schemas/storyboard.schema";
import { requireAuth } from "../middlewares/auth.middleware";
import { getErrorMessage } from "../utils/getErrorMessage";
import { errorResponseSchema } from "@video-venture/shared";

export const storyboardRoutes: FastifyPluginAsync = async function (fastify) {
  const storyboardService = new StoryboardService();
  const storyboardController = new StoryboardController(storyboardService);

  fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().route({
    method: "POST",
    url: "/storyboard/variants",
    schema: {
      tags: ["Storyboard"],
      summary: "Generate storyboard variants",
      description:
        "Generate multiple storyboard variants based on concept data. This endpoint creates several different storyboard options for the user to choose from.",
      security: [{ bearerAuth: [] }],
      body: StoryboardRequestSchema,
      response: {
        200: StoryboardCreationResponseSchema,
        401: errorResponseSchema,
        500: errorResponseSchema,
      },
    } satisfies FastifyZodOpenApiSchema,
    preHandler: requireAuth,
    handler: async (request, reply) => {
      try {
        const variants = await storyboardController.generateVariants(
          request.body
        );
        reply.send(variants);
      } catch (error: unknown) {
        reply.status(500).send({
          statusCode: 500,
          error: "Failed to generate storyboard variants",
          message: getErrorMessage(error),
        });
      }
    },
  });

  fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().route({
    method: "POST",
    url: "/storyboard/variant/additional",
    schema: {
      tags: ["Storyboard"],
      summary: "Generate additional storyboard variant",
      description:
        "Generate one additional storyboard variant based on concept data. Use this when you need more options beyond the initial variants.",
      security: [{ bearerAuth: [] }],
      body: StoryboardRequestSchema,
      response: {
        200: StoryboardResponseSchema,
        401: errorResponseSchema,
        500: errorResponseSchema,
      },
    } satisfies FastifyZodOpenApiSchema,
    preHandler: requireAuth,
    handler: async (request, reply) => {
      try {
        const variant = await storyboardController.generateAdditionalVariant(
          request.body
        );
        reply.send(variant);
      } catch (error: unknown) {
        reply.status(500).send({
          statusCode: 500,
          error: "Failed to generate additional variant",
          message: getErrorMessage(error),
        });
      }
    },
  });

  // New scene breakdown endpoint
  fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().route({
    method: "POST",
    url: "/storyboard/breakdown",
    schema: {
      tags: ["Storyboard"],
      summary: "Generate scene breakdown",
      description:
        "Generate a detailed scene breakdown from a selected storyboard variant and project settings. This creates individual scenes with image descriptions, voice-over text, and timing.",
      security: [{ bearerAuth: [] }],
      body: SceneBreakdownRequestSchema,
      response: {
        200: SceneBreakdownResponseSchema,
        401: errorResponseSchema,
        500: errorResponseSchema,
      },
    } satisfies FastifyZodOpenApiSchema,
    preHandler: requireAuth,
    handler: async (request, reply) => {
      try {
        const breakdown = await storyboardController.generateSceneBreakdown(
          request.body
        );
        reply.send(breakdown);
      } catch (error: unknown) {
        reply.status(500).send({
          statusCode: 500,
          error: "Failed to generate scene breakdown",
          message: getErrorMessage(error),
        });
      }
    },
  });
};
