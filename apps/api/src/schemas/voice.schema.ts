import { z } from "zod";

// Voice object schema (matches ElevenLabs API response)
export const VoiceSchema = z.object({
  voice_id: z.string(),
  name: z.string(),
  preview_url: z.string().url().optional(),
});

// Request schema for getting voices (optional query params)
export const GetVoicesRequestSchema = z.object({
  pageSize: z.coerce.number().min(1).max(100).optional().default(20),
});

// Response schema for getting voices
export const GetVoicesResponseSchema = z.object({
  voices: z.array(VoiceSchema),
  total_count: z.number(),
});

// Export types
export type Voice = z.infer<typeof VoiceSchema>;
export type GetVoicesRequest = z.infer<typeof GetVoicesRequestSchema>;
export type GetVoicesResponse = z.infer<typeof GetVoicesResponseSchema>;
