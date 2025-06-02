import { FastifyRequest, FastifyReply } from "fastify";
import { getAuth } from "@clerk/fastify";

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { userId } = getAuth(request);

  if (!userId) {
    reply.status(401).send({ message: "Authentication required" });
    return;
  }

  // Attach userId to request for easy access
  request.userId = userId;
}

// Extend Fastify types to include userId
declare module "fastify" {
  interface FastifyRequest {
    userId?: string;
  }
}
