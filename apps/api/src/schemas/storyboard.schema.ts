import { z } from "zod";
import {
  settingsDataSchema,
  storyboardDataSchema,
  sceneSchema,
  breakdownDataSchema,
  characterSchema,
} from "@video-venture/shared";

// Validates raw response from Gemini API (before adding IDs)
export const StoryboardLLMResponseSchema = z.array(
  z.object({
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    content: z.string(),
  })
);

// The storyboard request schema from the client
export const StoryboardRequestSchema = z.object({
  content: z.string(),
  format: z.string(),
  genre: z.string().optional(),
  tone: z.string().optional(),
  commercialBrand: z.string().optional(),
  commercialMessage: z.string().optional(),
  commercialTargetAudience: z.string().optional(),
  commercialCallToAction: z.string().optional(),
});

// The storyboard response schema from the server
export const StoryboardResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  content: z.string(),
});

export const StoryboardCreationResponseSchema = z.array(
  StoryboardResponseSchema
);

// Scene breakdown request schema
export const SceneBreakdownRequestSchema = z.object({
  storyboard: storyboardDataSchema,
  settings: settingsDataSchema,
  characters: z.array(characterSchema).optional(),
});

// Updated Scene breakdown LLM response schema to include music description
export const SceneBreakdownLLMResponseSchema = z.object({
  scenes: z.array(
    z.object({
      imageDescription: z.string(),
      voiceOver: z.string(),
      duration: z.number().min(1).max(15),
      order: z.number().min(1),
    })
  ),
  musicDescription: z.string(),
});

// Scene breakdown response schema
export const SceneBreakdownResponseSchema = breakdownDataSchema;

// Infer types
export type StoryboardLLMResponse = z.infer<typeof StoryboardLLMResponseSchema>;
export type StoryboardRequest = z.infer<typeof StoryboardRequestSchema>;
export type StoryboardResponse = z.infer<typeof StoryboardResponseSchema>;
export type SceneBreakdownRequest = z.infer<typeof SceneBreakdownRequestSchema>;
export type SceneBreakdownLLMResponse = z.infer<
  typeof SceneBreakdownLLMResponseSchema
>;
export type SceneBreakdownResponse = z.infer<
  typeof SceneBreakdownResponseSchema
>;
