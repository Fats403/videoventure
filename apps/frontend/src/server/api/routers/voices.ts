import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { env } from "@/env";

// Voice schema matching your API response
const VoiceSchema = z.object({
  voice_id: z.string(),
  name: z.string(),
  preview_url: z.string().url().optional(),
});

const GetVoicesResponseSchema = z.object({
  voices: z.array(VoiceSchema),
  total_count: z.number(),
});

export const voiceRouter = createTRPCRouter({
  // Get available voices from ElevenLabs
  getVoices: protectedProcedure
    .input(
      z.object({ pageSize: z.number().min(1).max(100).optional().default(20) }),
    )
    .output(GetVoicesResponseSchema)
    .query(async ({ ctx, input }) => {
      try {
        const token = await ctx.session.getToken();

        const response = await fetch(
          `${env.NEXT_PUBLIC_SERVER_API_URL}/voices?pageSize=${input.pageSize}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            `API request failed: ${response.status} ${response.statusText}`,
          );
        }

        const data = await response.json();
        return GetVoicesResponseSchema.parse(data);
      } catch (error) {
        console.error("Failed to fetch voices", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch voices",
          cause: error,
        });
      }
    }),
});
