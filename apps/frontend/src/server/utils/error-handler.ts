import { TRPCError } from "@trpc/server";
import { errorResponseSchema } from "@video-venture/shared";

/**
 * Safely handles API error responses with proper typing for frontend tRPC procedures
 */
export function handleApiError(error: unknown, fallbackMessage: string): never {
  const parsedError = errorResponseSchema.safeParse(error);
  if (parsedError.success) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: parsedError.data.message,
    });
  }

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: fallbackMessage,
  });
}
