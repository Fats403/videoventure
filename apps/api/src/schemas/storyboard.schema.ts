import { z } from "zod";

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

// Infer types
export type StoryboardLLMResponse = z.infer<typeof StoryboardLLMResponseSchema>;
export type StoryboardRequest = z.infer<typeof StoryboardRequestSchema>;
export type StoryboardResponse = z.infer<typeof StoryboardResponseSchema>;
