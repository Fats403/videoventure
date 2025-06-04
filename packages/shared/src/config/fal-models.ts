import type { AspectRatio } from "../types";

export interface FalVideoModel {
  id: string;
  name: string;
  description: string;
  maxDuration: number;
  supportedAspectRatios: AspectRatio[];
  costPerSecond: number;
  defaultConfig: Record<string, any>;
}

export const FAL_VIDEO_MODELS = {
  "kling-1.6": {
    id: "fal-ai/kling-video/v1.6/standard/text-to-video",
    name: "Kling 1.6",
    description: "High-quality text-to-video generation with good motion",
    maxDuration: 10,
    supportedAspectRatios: ["16:9", "9:16", "1:1"] as AspectRatio[],
    costPerSecond: 0.03,
    defaultConfig: {
      duration: "5",
      aspect_ratio: "16:9",
    },
  },
  "pika-v2.2": {
    id: "fal-ai/pika/v2.2/text-to-video",
    name: "Pika 2.2",
    description: "Fast and reliable text-to-video generation",
    maxDuration: 5,
    supportedAspectRatios: ["16:9", "9:16", "1:1"] as AspectRatio[],
    costPerSecond: 0.08,
    defaultConfig: {
      resolution: "720p",
      duration: "5",
      aspect_ratio: "16:9",
      seed: 0,
    },
  },
  "pixverse-v4": {
    id: "fal-ai/pixverse/v4/text-to-video",
    name: "Pixverse V4",
    description: "Stylized video generation with multiple style options",
    maxDuration: 8,
    supportedAspectRatios: ["16:9", "9:16", "1:1"] as AspectRatio[],
    costPerSecond: 0.04,
    defaultConfig: {
      resolution: "720p",
      duration: "5",
      aspect_ratio: "16:9",
      seed: 0,
    },
  },
} as const;

// Create VideoModel type from the keys
export type VideoModel = keyof typeof FAL_VIDEO_MODELS;

export function getFalModel(modelId: VideoModel): FalVideoModel {
  const model = FAL_VIDEO_MODELS[modelId];
  if (!model) {
    throw new Error(`Fal model '${modelId}' not found`);
  }
  return model;
}

export function getAvailableModels(): FalVideoModel[] {
  return Object.values(FAL_VIDEO_MODELS);
}
