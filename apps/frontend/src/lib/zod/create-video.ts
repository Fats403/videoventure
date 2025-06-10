import {
  breakdownDataSchema,
  settingsDataSchema,
  storyboardDataSchema,
  storyboardSchema,
  conceptDataSchema,
} from "@video-venture/shared";
import { z } from "zod";

export const createProjectResponseSchema = z.object({
  projectId: z.string(),
  storyboardVariants: z.array(storyboardSchema),
});

const VoiceSchema = z.object({
  voice_id: z.string(),
  name: z.string(),
  preview_url: z.string().url().optional(),
});

export const GetVoicesResponseSchema = z.object({
  voices: z.array(VoiceSchema),
  total_count: z.number(),
});

// Complete form schema for all steps
export const completeVideoFormSchema = z.object({
  // Step 1: Concept
  concept: conceptDataSchema,

  // Step 2: Storyboard
  storyboard: storyboardDataSchema.optional(),

  // Step 3: Settings
  settings: settingsDataSchema.optional(),

  // Step 4: Breakdown
  breakdown: breakdownDataSchema.optional(),
});

// Export inferred types
export type GetVoicesResponse = z.infer<typeof GetVoicesResponseSchema>;
export type CreateProjectResponse = z.infer<typeof createProjectResponseSchema>;
export type CompleteVideoForm = z.infer<typeof completeVideoFormSchema>;
