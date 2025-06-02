import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { StoryboardController } from "../controllers/storyboard.controller";
import { StoryboardService } from "../services/storyboard.service";
import {
  StoryboardRequestSchema,
  StoryboardCreationResponseSchema,
  StoryboardResponseSchema,
} from "../schemas/storyboard.schema";
import { requireAuth } from "../middlewares/auth.middleware";
import { getErrorMessage } from "../utils/getErrorMessage";
import { ErrorResponseSchema } from "../schemas/error.schema";

export const storyboardRoutes: FastifyPluginAsync = async function (fastify) {
  const storyboardService = new StoryboardService();
  const storyboardController = new StoryboardController(storyboardService);

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/storyboard/variants",
    schema: {
      body: StoryboardRequestSchema,
      response: {
        200: StoryboardCreationResponseSchema,
        500: ErrorResponseSchema,
      },
    },
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

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/storyboard/variant/additional",
    schema: {
      body: StoryboardRequestSchema,
      response: {
        200: StoryboardResponseSchema,
        500: ErrorResponseSchema,
      },
    },
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
};
