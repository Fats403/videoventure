import { z } from "zod";

// Schema for creating a new video
export const CreateVideoSchema = z.object({
  storyIdea: z.string().min(10).max(500),
  maxScenes: z.number().int().min(1).max(10).optional(),
  voiceId: z.string().optional(),
});

// Schema for job ID parameter
export const JobParamSchema = z.object({
  jobId: z.string().min(10).max(30),
});
