import { FastifyPluginAsync } from "fastify";
import {
  FastifyZodOpenApiTypeProvider,
  FastifyZodOpenApiSchema,
} from "fastify-zod-openapi";
import { VoiceController } from "../controllers/voice.controller";
import { VoiceService } from "../services/voice.service";
import {
  GetVoicesRequestSchema,
  GetVoicesResponseSchema,
} from "../schemas/voice.schema";
import { requireAuth } from "../middlewares/auth.middleware";
import { getErrorMessage } from "../utils/getErrorMessage";
import { errorResponseSchema } from "@video-venture/shared";

export const voiceRoutes: FastifyPluginAsync = async function (fastify) {
  const voiceService = new VoiceService();
  const voiceController = new VoiceController(voiceService);

  fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().route({
    method: "GET",
    url: "/voices",
    schema: {
      tags: ["Voice"],
      summary: "Get available voices",
      description:
        "Retrieve a list of available ElevenLabs voices for text-to-speech generation. Each voice includes an ID, name, and optional preview URL.",
      security: [{ bearerAuth: [] }],
      querystring: GetVoicesRequestSchema,
      response: {
        200: GetVoicesResponseSchema,
        401: errorResponseSchema,
        500: errorResponseSchema,
      },
    } satisfies FastifyZodOpenApiSchema,
    preHandler: requireAuth,
    handler: async (request, reply) => {
      try {
        const voices = await voiceController.getVoices(request.query);
        reply.send(voices);
      } catch (error: unknown) {
        reply.status(500).send({
          statusCode: 500,
          error: "Failed to fetch voices",
          message: getErrorMessage(error),
        });
      }
    },
  });
};
