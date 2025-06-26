import { FastifyPluginAsync } from "fastify";
import {
  FastifyZodOpenApiTypeProvider,
  FastifyZodOpenApiSchema,
} from "fastify-zod-openapi";
import { CharacterController } from "../controllers/character.controller";
import { CharacterService } from "../services/character.service";
import {
  CharacterCreationRequestSchema,
  CharacterCreationResponseSchema,
  CharacterListResponseSchema,
} from "../schemas/character.schema";
import { requireAuth } from "../middlewares/auth.middleware";
import { getErrorMessage } from "../utils/getErrorMessage";
import { ErrorResponseSchema } from "../schemas/error.schema";
import { z } from "zod";

export const characterRoutes: FastifyPluginAsync = async function (fastify) {
  const characterService = new CharacterService();
  const characterController = new CharacterController(characterService);

  // Generate character
  fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().route({
    method: "POST",
    url: "/character/generate",
    schema: {
      tags: ["Character"],
      summary: "Generate character image",
      description: "Generate a character image using OpenAI's GPT-Image-1",
      security: [{ bearerAuth: [] }],
      body: CharacterCreationRequestSchema,
      response: {
        200: CharacterCreationResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    } satisfies FastifyZodOpenApiSchema,
    preHandler: requireAuth,
    handler: async (request, reply) => {
      try {
        const result = await characterController.generateCharacter(
          request.body,
          request.userId!
        );
        reply.send(result);
      } catch (error: unknown) {
        reply.status(500).send({
          statusCode: 500,
          error: "Failed to generate character",
          message: getErrorMessage(error),
        });
      }
    },
  });

  // Update character
  fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().route({
    method: "PUT",
    url: "/character/:characterId",
    schema: {
      tags: ["Character"],
      summary: "Update character and regenerate image",
      description:
        "Update character details and regenerate image, replacing the old one",
      security: [{ bearerAuth: [] }],
      params: z.object({
        characterId: z.string(),
      }),
      body: CharacterCreationRequestSchema,
      response: {
        200: CharacterCreationResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    } satisfies FastifyZodOpenApiSchema,
    preHandler: requireAuth,
    handler: async (request, reply) => {
      try {
        const result = await characterController.updateCharacter(
          request.params.characterId,
          request.body,
          request.userId!
        );
        reply.send(result);
      } catch (error: unknown) {
        const message = getErrorMessage(error);
        if (message.includes("not found")) {
          reply.status(404).send({
            statusCode: 404,
            error: "Character not found",
            message,
          });
        } else {
          reply.status(500).send({
            statusCode: 500,
            error: "Failed to update character",
            message,
          });
        }
      }
    },
  });

  // Delete character
  fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().route({
    method: "DELETE",
    url: "/character/:characterId",
    schema: {
      tags: ["Character"],
      summary: "Delete character",
      description: "Delete a character and its associated image",
      security: [{ bearerAuth: [] }],
      params: z.object({
        characterId: z.string(),
      }),
      response: {
        200: z.object({
          success: z.boolean(),
          message: z.string(),
        }),
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    } satisfies FastifyZodOpenApiSchema,
    preHandler: requireAuth,
    handler: async (request, reply) => {
      try {
        const result = await characterController.deleteCharacter(
          request.params.characterId,
          request.userId!
        );
        reply.send(result);
      } catch (error: unknown) {
        const message = getErrorMessage(error);
        if (message.includes("not found")) {
          reply.status(404).send({
            statusCode: 404,
            error: "Character not found",
            message,
          });
        } else {
          reply.status(500).send({
            statusCode: 500,
            error: "Failed to delete character",
            message,
          });
        }
      }
    },
  });
};
