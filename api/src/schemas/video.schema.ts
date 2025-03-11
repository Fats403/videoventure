import { z } from "zod";

export const CreateVideoSchema = z.object({
  inputConcept: z.string().min(10).max(500),
  maxScenes: z.number().int().min(1).max(10).optional(),
  voiceId: z.string().optional(),
});

export const JobParamSchema = z.object({
  jobId: z.string().min(10).max(30),
});
