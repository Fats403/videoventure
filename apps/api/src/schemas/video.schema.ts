import { z } from "zod";

export const SceneSchema = z.object({
  scene_number: z.number().int().positive(),
  visual_description: z.string().min(50).max(512),
  voiceover: z.string().max(650),
});

export const StoryboardSchema = z.object({
  title: z.string(),
  visualStyle: z.string(),
  tags: z.array(z.string()).min(3).max(5),
  scenes: z
    .array(SceneSchema)
    .min(2)
    .refine(
      (scenes) => {
        // Check if scene numbers are sequential starting from 1
        const sortedScenes = [...scenes].sort(
          (a, b) => a.scene_number - b.scene_number
        );
        return sortedScenes.every(
          (scene, index) => scene.scene_number === index + 1
        );
      },
      {
        message: "Scene numbers must be sequential starting from 1",
      }
    ),
});

export const CreateStoryboardSchema = z.object({
  inputConcept: z.string().min(10).max(500),
});

export const CreateVideoSchema = z.object({
  storyboard: StoryboardSchema,
  voiceId: z.string().optional(),
  videoModel: z.string().optional(),
  providerConfig: z.record(z.any()).optional(),
});

export const GetVideoSignedUrlsSchema = z.object({
  videoId: z.string().min(10).max(30),
  version: z.number().int().min(1).max(10).optional(),
});

export const JobParamSchema = z.object({
  jobId: z.string().min(10).max(30),
});
