import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { StoryboardController } from "../controllers/storyboard.controller";
import { StoryboardService } from "../services/storyboard.service";
import { StoryboardRequestSchema } from "../schemas/video.schema";
import { requireAuth } from "../middlewares/auth.middleware";

export const storyboardRoutes: FastifyPluginAsync = async function (fastify) {
  const storyboardService = new StoryboardService();
  const storyboardController = new StoryboardController(storyboardService);

  fastify.withTypeProvider<ZodTypeProvider>().post(
    "/storyboard/variants",
    {
      schema: {
        body: StoryboardRequestSchema,
      },
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const variants = await storyboardController.generateVariants(
          request.body
        );
        return variants;
      } catch (error: any) {
        reply.status(500);
        return {
          error: "Failed to generate storyboard variants",
          message: error.message,
        };
      }
    }
  );

  fastify.withTypeProvider<ZodTypeProvider>().post(
    "/storyboard/variant/additional",
    {
      schema: {
        body: StoryboardRequestSchema,
      },
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const variant = await storyboardController.generateAdditionalVariant(
          request.body
        );
        return variant;
      } catch (error: any) {
        reply.status(500);
        return {
          error: "Failed to generate additional variant",
          message: error.message,
        };
      }
    }
  );
};
