import { z } from "zod";

// User preferences schema
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
  voiceActor: z.string().optional(),
  // Commercial-specific fields
  commercialTargetAudience: z.string().optional(),
  commercialMessage: z.string().optional(),
  commercialBrand: z.string().optional(),
  commercialCallToAction: z.string().optional(),
});

// Storyboard variant schema
export const storyboardVariantSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  content: z.string(),
});

// Storyboard data schema
export const storyboardDataSchema = z.object({
  selectedVariantId: z.string().optional(),
  variants: z.array(storyboardVariantSchema),
  customContent: z.string().optional(),
});

// Character schema
export const characterSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Character name is required"),
  description: z.string().optional(),
  image: z.string().optional(),
  appearance: z.string().optional(),
  clothing: z.string().optional(),
  voice: z.string().optional(),
  age: z.string().optional(),
});

// Settings data schema
export const settingsDataSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  videoModel: z.enum(["standard", "cinematic", "experimental"]),
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
  characters: z.array(characterSchema),
});

// Scene schema
export const sceneSchema = z.object({
  id: z.string(),
  imageUrl: z.string().url("Invalid image URL"),
  imageDescription: z.string().min(1, "Image description is required"),
  voiceOver: z.string().min(1, "Voice over is required"),
  duration: z.number().min(1, "Duration must be at least 1 second"),
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
  status: z.enum(["QUEUED", "PROCESSING", "COMPLETED", "FAILED"]),
  type: z.enum(["CREATE_VIDEO", "REGENERATE_SCENE"]),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  errorMessage: z.string().optional(),
  sceneId: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
});

// Project status schema
export const projectStatusSchema = z.enum([
  "storyboard",
  "settings",
  "breakdown",
  "generating",
  "completed",
  "failed",
]);

// Video model schema
export const videoModelSchema = z.enum([
  "standard",
  "cinematic",
  "experimental",
]);

export const projectVisibilitySchema = z.enum(["public", "private"]);

// Aspect ratio schema
export const aspectRatioSchema = z.enum(["16:9", "1:1", "9:16"]);

// Video style schema
export const videoStyleSchema = z.enum([
  "none",
  "boost",
  "scribble",
  "filmnoir",
  "dreamy",
  "vintage",
  "neon",
]);

// Plan type schema
export const planTypeSchema = z.enum(["starter", "pro", "enterprise"]);

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
  projectName: z.string().optional(),
  status: projectStatusSchema,
  concept: conceptDataSchema.optional(),
  storyboard: storyboardDataSchema.optional(),
  settings: settingsDataSchema.optional(),
  breakdown: breakdownDataSchema.optional(),
  video: videoDataSchema.optional(),
  currentJobId: z.string().optional(),
  history: z.record(z.string(), videoHistorySchema).optional(),
  views: z.number().min(0).default(0),
  version: z.number().min(0).default(1),
  visibility: projectVisibilitySchema,
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

// New video project schema (for creation)
export const newVideoProjectSchema = z.object({
  userId: z.string(),
  projectName: z.string().optional(),
  status: projectStatusSchema.default("storyboard"),
  concept: conceptDataSchema.optional(),
  storyboard: storyboardDataSchema.optional(),
  settings: settingsDataSchema.optional(),
  breakdown: breakdownDataSchema.optional(),
  video: videoDataSchema.optional(),
});

// Add API response schemas at the end, before the type exports
export const createProjectResponseSchema = z.object({
  projectId: z.string(),
  storyboardVariants: z.array(storyboardVariantSchema),
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

  // Project metadata
  projectId: z.string().optional(),
  projectName: z.string().optional(),
});

// Export inferred types
export type CreateProjectResponse = z.infer<typeof createProjectResponseSchema>;
export type CompleteVideoForm = z.infer<typeof completeVideoFormSchema>;

// Export inferred types (these should match the database types)
export type UserPreferences = z.infer<typeof userPreferencesSchema>;
export type ConceptData = z.infer<typeof conceptDataSchema>;
export type StoryboardVariant = z.infer<typeof storyboardVariantSchema>;
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
export type User = z.infer<typeof userSchema>;
export type VideoProject = z.infer<typeof videoProjectSchema>;
export type NewVideoProject = z.infer<typeof newVideoProjectSchema>;
