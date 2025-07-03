import type { AspectRatio } from "../types";

export interface FalVideoModel {
  id: string;
  name: string;
  description: string;
  supportedDurations: number[];
  supportedAspectRatios: AspectRatio[];
  costPerSecond: number;
  defaultConfig: Record<string, any>;
}

export interface FalMusicModel {
  id: string;
  name: string;
  description: string;
  supportedDurations: number[];
  costPerSecond: number;
  defaultConfig: Record<string, any>;
}

export const FAL_VIDEO_MODELS: Record<string, FalVideoModel> = {
  "kling-2.1-standard": {
    id: "fal-ai/kling-video/v2.1/standard/image-to-video",
    name: "Kling 2.1 Standard",
    description:
      "Kling 2.1 Standard is a cost-efficient endpoint for the Kling 2.1 model, delivering high-quality image-to-video generation",
    supportedDurations: [5, 10],
    supportedAspectRatios: ["16:9", "9:16", "1:1"] as AspectRatio[],
    costPerSecond: 0.05,
    defaultConfig: {
      duration: "5",
      aspect_ratio: "16:9",
      negative_prompt: "blur, distort, and low quality",
    },
  },
  "kling-2.1-master": {
    id: "fal-ai/kling-video/v2.1/master/image-to-video",
    name: "Kling 2.1 Master",
    description:
      "Kling 2.1 Master: The premium endpoint for Kling 2.1, designed for top-tier image-to-video generation with unparalleled motion fluidity, cinematic visuals, and exceptional prompt precision.",
    supportedDurations: [5, 10],
    supportedAspectRatios: ["16:9", "9:16", "1:1"] as AspectRatio[],
    costPerSecond: 0.28,
    defaultConfig: {
      duration: "5",
      aspect_ratio: "16:9",
      negative_prompt: "blur, distort, and low quality",
    },
  },
  "pixverse-4.5": {
    id: "fal-ai/pixverse/v4.5/image-to-video",
    name: "Pixverse 4.5",
    description:
      "Generate high quality video clips from text and image prompts using PixVerse v4.5",
    supportedDurations: [5], // They do allow for 8s, but its double the cost and not worth supporting
    supportedAspectRatios: ["16:9", "9:16", "1:1"] as AspectRatio[],
    costPerSecond: 0.08,
    defaultConfig: {
      duration: "5",
      aspect_ratio: "16:9",
    },
  },
  "veo-3.0": {
    id: "fal-ai/veo3",
    name: "VEO 3.0",
    description:
      "Veo 3 by Google, the most advanced AI video generation model in the world",
    supportedDurations: [8],
    supportedAspectRatios: ["16:9", "9:16", "1:1"] as AspectRatio[],
    costPerSecond: 0.5,
    defaultConfig: {
      duration: "5",
      aspect_ratio: "16:9",
      generate_audio: false,
    },
  },
};

export const FAL_MUSIC_MODELS: Record<string, FalMusicModel> = {
  "cassette-ai": {
    id: "CassetteAI/music-generator",
    name: "CassetteAI Music Generator",
    description:
      "High-quality AI music generation with customizable styles and moods",
    supportedDurations: [30, 60, 120, 180],
    costPerSecond: 0.02,
    defaultConfig: {},
  },
  // Add more music models as they become available
};

type VideoModel = keyof typeof FAL_VIDEO_MODELS;
type MusicModel = keyof typeof FAL_MUSIC_MODELS;

export function getFalVideoModel(modelId: VideoModel): FalVideoModel {
  const model = FAL_VIDEO_MODELS[modelId];
  if (!model) {
    throw new Error(`Fal video model '${modelId}' not found`);
  }
  return model;
}

export function getFalMusicModel(modelId: MusicModel): FalMusicModel {
  const model = FAL_MUSIC_MODELS[modelId];
  if (!model) {
    throw new Error(`Fal music model '${modelId}' not found`);
  }
  return model;
}

// Keep the old function for backward compatibility
export function getFalModel(modelId: VideoModel): FalVideoModel {
  return getFalVideoModel(modelId);
}

export function getAvailableVideoModels(): FalVideoModel[] {
  return Object.values(FAL_VIDEO_MODELS);
}

export function getAvailableMusicModels(): FalMusicModel[] {
  return Object.values(FAL_MUSIC_MODELS);
}
