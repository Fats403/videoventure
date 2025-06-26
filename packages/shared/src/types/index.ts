import { FAL_VIDEO_MODELS } from "../config/fal-models";
import { z } from "zod";

// Enums schemas
export const jobTypeSchema = z.enum(["CREATE_VIDEO", "REGENERATE_SCENE"]);
export const projectVisibilitySchema = z.enum(["public", "private"]);
export const aspectRatioSchema = z.enum(["16:9", "1:1", "9:16"]);
export const planTypeSchema = z.enum(["starter", "pro", "enterprise"]);
export const videoStatusSchema = z.enum([
  "QUEUED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);
export const projectStatusSchema = z.enum([
  "storyboard",
  "settings",
  "breakdown",
  "generating",
  "completed",
  "failed",
]);
export const videoStyleSchema = z.enum([
  "none",
  "boost",
  "scribble",
  "filmnoir",
  "dreamy",
  "vintage",
  "neon",
]);

// Create the video model schema dynamically from FAL_VIDEO_MODELS
export const videoModelSchema = z.enum(
  Object.keys(FAL_VIDEO_MODELS) as [
    keyof typeof FAL_VIDEO_MODELS,
    ...Array<keyof typeof FAL_VIDEO_MODELS>,
  ]
);

export const jobSchema = z.object({
  jobId: z.string(),
  videoId: z.string(),
  userId: z.string(),
  type: jobTypeSchema,
});

export const userPreferencesSchema = z
  .object({
    theme: z.enum(["light", "dark", "system"]).optional(),
    notifications: z
      .object({
        email: z.boolean(),
        marketing: z.boolean(),
      })
      .optional(),
    defaultVideoModel: z
      .enum(["standard", "cinematic", "experimental"])
      .optional(),
    defaultAspectRatio: z.enum(["16:9", "1:1", "9:16"]).optional(),
    autoSaveEnabled: z.boolean().default(false),
  })
  .optional();

// Concept data schema
export const conceptDataSchema = z.object({
  option: z.enum(["ai", "script"]),
  content: z.string().min(10, "Content must be at least 10 characters"),
  format: z.enum(["custom", "shortFilm", "commercial"]),
  customFormat: z.string().optional(),
  genre: z.string().optional(),
  tone: z.string().optional(),
  voiceId: z.string().optional(),
  // Commercial-specific fields
  commercialTargetAudience: z.string().optional(),
  commercialMessage: z.string().optional(),
  commercialBrand: z.string().optional(),
  commercialCallToAction: z.string().optional(),
});

// Storyboard variant schema
export const storyboardSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  content: z.string(),
});

// Storyboard data schema
export const storyboardDataSchema = z.object({
  selectedVariantId: z.string().optional(),
  variants: z.array(storyboardSchema),
  customContent: z.string().optional(),
});

export const characterSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  appearance: z.string().nullable(),
  age: z.string().nullable(),
  imageUrl: z.string().url().optional(),
  storageKey: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Settings data schema
export const settingsDataSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  videoModel: videoModelSchema,
  aspectRatio: z.enum(["16:9", "1:1", "9:16"]),
  videoStyle: z
    .enum([
      "none",
      "boost",
      "scribble",
      "filmnoir",
      "dreamy",
      "vintage",
      "neon",
    ])
    .optional(),
  cinematicInspiration: z.string().optional(),
  characters: z.array(z.string()),
});

// Scene schema
export const sceneSchema = z.object({
  id: z.string(),
  imageUrl: z.string().url("Invalid image URL"),
  imageDescription: z.string().min(1, "Image description is required"),
  voiceOver: z.string().min(1, "Voice over is required"),
  duration: z.number().min(1, "Duration must be at least 1 second").optional(),
  order: z.number().min(0),
});

// Breakdown data schema
export const breakdownDataSchema = z.object({
  scenes: z.array(sceneSchema),
  musicDescription: z.string().optional(),
});

// Video data schema
export const videoDataSchema = z.object({
  thumbnailUrl: z.string().url().optional(),
  duration: z.number().min(0).optional(),
  fileSize: z.number().min(0).optional(),
});

export const videoHistorySchema = z.object({
  jobId: z.string(),
  status: videoStatusSchema,
  type: jobTypeSchema,
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  errorMessage: z.string().optional(),
  sceneId: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
});

// User schema (for API validation)
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  imageUrl: z.string().url().optional(),
  preferences: userPreferencesSchema,
  planType: planTypeSchema,
  videoCredits: z.number().min(0),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

// Video project schema (for API validation)
export const videoProjectSchema = z.object({
  id: z.string(),
  userId: z.string(),
  projectName: z.string().nullable(),
  status: projectStatusSchema,
  concept: conceptDataSchema.nullable(),
  storyboard: storyboardDataSchema.nullable(),
  settings: settingsDataSchema.nullable(),
  breakdown: breakdownDataSchema.nullable(),
  video: videoDataSchema.nullable(),
  currentJobId: z.string().nullable(),
  history: z.record(z.string(), videoHistorySchema).nullable(),
  views: z.number().min(0).nullable(),
  version: z.number().min(0).nullable(),
  visibility: projectVisibilitySchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Export inferred types
export type UserPreferences = z.infer<typeof userPreferencesSchema>;
export type ConceptData = z.infer<typeof conceptDataSchema>;
export type Storyboard = z.infer<typeof storyboardSchema>;
export type StoryboardData = z.infer<typeof storyboardDataSchema>;
export type Character = z.infer<typeof characterSchema>;
export type SettingsData = z.infer<typeof settingsDataSchema>;
export type Scene = z.infer<typeof sceneSchema>;
export type BreakdownData = z.infer<typeof breakdownDataSchema>;
export type VideoData = z.infer<typeof videoDataSchema>;
export type VideoHistory = z.infer<typeof videoHistorySchema>;
export type ProjectVisibility = z.infer<typeof projectVisibilitySchema>;
export type ProjectStatus = z.infer<typeof projectStatusSchema>;
export type VideoModel = z.infer<typeof videoModelSchema>;
export type AspectRatio = z.infer<typeof aspectRatioSchema>;
export type VideoStyle = z.infer<typeof videoStyleSchema>;
export type PlanType = z.infer<typeof planTypeSchema>;
export type JobType = z.infer<typeof jobTypeSchema>;
export type User = z.infer<typeof userSchema>;
export type VideoProject = z.infer<typeof videoProjectSchema>;
export type Job = z.infer<typeof jobSchema>;
