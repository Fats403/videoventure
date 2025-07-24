import "zod-openapi/extend";
import { z } from "zod";
import { type ZodOpenApiVersion } from "zod-openapi";
import Fastify from "fastify";
import { clerkPlugin } from "@clerk/fastify";
import {
  fastifyZodOpenApiPlugin,
  fastifyZodOpenApiTransform,
  fastifyZodOpenApiTransformObject,
  serializerCompiler,
  validatorCompiler,
  FastifyZodOpenApiTypeProvider,
} from "fastify-zod-openapi";
import { storyboardRoutes } from "./routes/storyboard.routes";
import { voiceRoutes } from "./routes/voice.routes";
import { characterRoutes } from "./routes/character.routes";
import { videoRoutes } from "./routes/video.routes";

// Load environment variables
const PORT = process.env.PORT || 6969;

// Start server
const start = async () => {
  try {
    // Initialize Fastify app
    const fastify = Fastify({
      logger: true,
    }).withTypeProvider<FastifyZodOpenApiTypeProvider>();

    // Set up Zod validation and serialization
    fastify.setValidatorCompiler(validatorCompiler);
    fastify.setSerializerCompiler(serializerCompiler);

    // Register the Zod OpenAPI plugin
    await fastify.register(fastifyZodOpenApiPlugin);

    // Register Swagger with the transform functions
    await fastify.register(import("@fastify/swagger"), {
      openapi: {
        info: {
          title: "VideoVenture API",
          description:
            "API for VideoVenture - AI-powered video generation platform",
          version: "1.0.0",
        },
        openapi: "3.0.3" satisfies ZodOpenApiVersion,
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
              description: "Clerk JWT token",
            },
          },
        },
        tags: [
          {
            name: "Storyboard",
            description: "Storyboard generation endpoints",
          },
          {
            name: "Voice",
            description: "Voice and text-to-speech endpoints",
          },
          {
            name: "Health",
            description: "Health check endpoints",
          },
          {
            name: "Character",
            description: "Character endpoints",
          },
        ],
      },
      transform: fastifyZodOpenApiTransform,
      transformObject: fastifyZodOpenApiTransformObject,
    });

    // Register Swagger UI
    await fastify.register(import("@fastify/swagger-ui"), {
      routePrefix: "/docs",
    });

    fastify.route({
      method: "GET",
      url: "/healthcheck",
      schema: {
        tags: ["Health"],
        summary: "Health check",
        description: "Check if the API is running",
        response: {
          200: z.object({
            status: z.string().openapi({ example: "ok" }),
            timestamp: z
              .string()
              .openapi({ example: "2024-01-01T00:00:00.000Z" }),
            uptime: z.number().openapi({ example: 123.456 }),
          }),
        },
      },
      handler: async () => ({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      }),
    });

    // Register protected routes with Clerk authentication
    await fastify.register(async function protectedRoutes(instance) {
      // Register Clerk plugin only for protected routes
      await instance.register(clerkPlugin);

      // Register protected routes
      await instance.register(storyboardRoutes);
      await instance.register(voiceRoutes);
      await instance.register(characterRoutes);
      await instance.register(videoRoutes);
    });

    // Global error handling
    fastify.setErrorHandler((error, request, reply) => {
      console.error("Error:", error);
      reply.status(500).send({
        statusCode: 500,
        error: "Internal Server Error",
        message: error.message,
      });
    });

    await fastify.listen({
      port: Number(PORT),
      host: "0.0.0.0",
    });

    console.log(`🚀 Fastify server listening on port ${PORT}`);
    console.log(
      `📚 API documentation available at http://localhost:${PORT}/docs`
    );
    console.log(
      `🔍 Health check available at http://localhost:${PORT}/healthcheck`
    );
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
};

start();
