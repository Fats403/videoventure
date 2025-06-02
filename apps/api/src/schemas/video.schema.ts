import { z } from "zod";

export const StoryboardVariantSchema = z.object({
  variants: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      tags: z.array(z.string()),
      content: z.string(),
    })
  ),
});

export const StartVideoJobSchema = z.object({
  videoId: z.string(),
});

export const GetVideoSignedUrlsSchema = z.object({
  videoId: z.string(),
  version: z.number().optional(),
});

// Add storyboard request schema
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

// Infer types
export type StoryboardRequest = z.infer<typeof StoryboardRequestSchema>;
export type StoryboardVariant = z.infer<typeof StoryboardVariantSchema>;
