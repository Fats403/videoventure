import { FastifyRequest, FastifyReply } from "fastify";
import { getAuth } from "@clerk/fastify";

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { userId } = getAuth(request);

  if (!userId) {
    reply.status(401).send({
      statusCode: 401,
      message: "Authentication required",
      error: "Unauthorized",
    });
    return;
  }

  request.userId = userId;
}

// Extend Fastify types to include userId
declare module "fastify" {
  interface FastifyRequest {
    userId?: string;
  }
}
