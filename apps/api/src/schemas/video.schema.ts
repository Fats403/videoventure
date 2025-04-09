import { z } from "zod";

export const CreateStoryboardSchema = z.object({
  inputConcept: z.string().min(10).max(500),
});

export const SceneSchema = z.object({
  sceneNumber: z.number().int().positive(),
  description: z
    .string()
    .min(40, "Visual description needs sufficient detail.")
    .max(512, "Visual description exceeds maximum length (512 chars)."),
  voiceover: z.string().min(1, "Voiceover cannot be empty."),
});

export const StoryboardSchema = z.object({
  title: z.string().min(1, "Title cannot be empty."),
  tags: z.array(z.string()).min(3, "At least 3 tags required.").max(5),
  musicDescription: z
    .string()
    .min(
      15,
      "Music description needs more detail (instruments, mood, tempo, genre, intent)."
    )
    .max(256, "Music description exceeds maximum length (256 chars)."),
  scenes: z
    .array(SceneSchema)
    .min(2, "Minimum of 2 scenes required.")
    .max(12, `Maximum number of scenes cannot exceed 12.`)
    .refine(
      (scenes) => {
        const sortedScenes = [...scenes].sort(
          (a, b) => a.sceneNumber - b.sceneNumber
        );
        return sortedScenes.every(
          (scene, index) => scene.sceneNumber === index + 1
        );
      },
      {
        message: "Scene numbers must be sequential starting from 1.",
      }
    ),
});

export const UpdateVideoDetailsSchema = z.object({
  videoId: z.string().min(10).max(30),
  storyboard: StoryboardSchema.optional(),
  voiceId: z.string().optional(),
  videoModel: z.string().optional(),
  providerConfig: z.record(z.any()).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
});

export const StartVideoJobSchema = z.object({
  videoId: z.string().min(10).max(30),
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
