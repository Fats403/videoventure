import { VideoModel } from "../config/fal-models";

export type JobType = "CREATE_VIDEO" | "REGENERATE_SCENE";

export type ProjectStatus =
  | "storyboard"
  | "settings"
  | "breakdown"
  | "generating"
  | "completed"
  | "failed";

export type ProjectVisibility = "public" | "private";

export type AspectRatio = "16:9" | "1:1" | "9:16";
export type VideoStyle =
  | "none"
  | "boost"
  | "scribble"
  | "filmnoir"
  | "dreamy"
  | "vintage"
  | "neon";

export type PlanType = "starter" | "pro" | "enterprise";

// User preferences interface
export interface UserPreferences {
  theme?: "light" | "dark" | "system";
  notifications?: {
    email: boolean;
    marketing: boolean;
  };
  defaultVideoModel?: VideoModel;
  defaultAspectRatio?: AspectRatio;
  autoSaveEnabled?: boolean;
}

// Concept data interface
export interface ConceptData {
  option: "ai" | "script";
  content: string;
  format: "custom" | "shortFilm" | "commercial";
  customFormat?: string;
  genre?: string;
  tone?: string;
  voiceId?: string;
  // Commercial-specific fields
  commercialTargetAudience?: string;
  commercialMessage?: string;
  commercialBrand?: string;
  commercialCallToAction?: string;
}

// Storyboard variant interface
export interface StoryboardVariant {
  id: string;
  title: string;
  description: string;
  tags: string[];
  content: string;
}

// Storyboard data interface
export interface StoryboardData {
  selectedVariantId?: string;
  variants: StoryboardVariant[];
  customContent?: string;
}

// Video history for tracking job progress
export interface VideoHistory {
  jobId: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  type: JobType;
  createdAt: Date;
  updatedAt?: Date;
  errorMessage?: string;
  sceneId?: string;
  progress?: number; // 0-100
}

export interface Scene {
  id: string;
  imageUrl: string;
  imageDescription: string;
  voiceOver: string;
  order: number;
  duration?: number;
}

export interface Character {
  id: string;
  name: string;
  description?: string;
  image?: string;
  appearance?: string;
  clothing?: string;
  voice?: string;
  age?: string;
}

// Breakdown data (what the worker needs)
export interface BreakdownData {
  scenes: Scene[];
  musicDescription?: string;
}

// Settings data
export interface SettingsData {
  projectName: string;
  videoModel: VideoModel;
  aspectRatio: AspectRatio;
  videoStyle?: VideoStyle;
  cinematicInspiration?: string;
  characters: Character[];
}

// Video data (final output)
export interface VideoData {
  thumbnailUrl?: string;
  duration?: number;
  fileSize?: number;
}

// Job interface for BullMQ
export interface Job {
  jobId: string;
  videoId: string;
  userId: string;
  type: JobType;
}

// User interface
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  preferences?: UserPreferences;
  planType: PlanType;
  videoCredits: number;
  createdAt: Date;
  updatedAt?: Date;
}

// Video project interface
export interface VideoProject {
  id: string;
  userId: string;
  projectName?: string;
  status: ProjectStatus;
  currentJobId?: string;
  history?: Record<string, VideoHistory>;
  views: number;
  version: number;
  visibility: ProjectVisibility;
  concept?: ConceptData;
  storyboard?: StoryboardData;
  breakdown?: BreakdownData;
  settings?: SettingsData;
  video?: VideoData;
  createdAt: Date;
  updatedAt: Date;
}
