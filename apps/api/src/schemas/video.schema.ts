import { z } from "zod";

export const StartVideoJobSchema = z.object({
  videoId: z.string(),
});

export const GetVideoSignedUrlsSchema = z.object({
  videoId: z.string(),
  version: z.number().optional(),
});
