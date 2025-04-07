import { z } from "zod";

// Provider capability interface
export interface ProviderCapabilities {
  supportedAspectRatios: string[];
  supportedDurations: number[];
  costPerSecond: number;
  averageProcessingTime: number; // in seconds
}

// Provider model configuration interface
export interface ProviderModelConfig {
  id: string;
  name: string;
  description: string;
  provider: string;
  capabilities: ProviderCapabilities;
  schema: z.ZodType<any>;
  defaultConfig: Record<string, any>;
}

// Define Nova Reel schema
export const NovaReelConfigSchema = z.object({
  seed: z.number().optional(),
});

// Define Fal.ai Kling schema
export const FalKlingConfigSchema = z.object({
  duration: z.enum(["5", "10"]).optional(),
  aspect_ratio: z.enum(["16:9", "9:16", "1:1"]).optional(),
  camera_control: z
    .enum([
      "down_back",
      "forward_up",
      "right_turn_forward",
      "left_turn_forward",
    ])
    .optional(),
});

// Define Pika V2 schema
export const PikaV2ConfigSchema = z.object({
  duration: z.enum(["5"]).optional(),
  negative_prompt: z.string().optional(),
  resolution: z.enum(["720p"]).optional(),
  aspect_ratio: z.enum(["16:9", "9:16", "1:1"]).optional(),
  seed: z.number().optional(),
});

// Define Pika V2 schema
export const PixverseV4ConfigSchema = z.object({
  duration: z.enum(["5", "8"]).optional(),
  negative_prompt: z.string().optional(),
  resolution: z.enum(["720p"]).optional(),
  style: z
    .enum(["anime", "3d_animation", "clay", "comic", "cyberpunk"])
    .optional(),
  aspect_ratio: z.enum(["16:9", "9:16", "1:1"]).optional(),
  seed: z.number().optional(),
});

// Define all provider model configurations
export const PROVIDER_MODELS: Record<string, ProviderModelConfig> = {
  "nova-reel": {
    id: "amazon.nova-reel-v1:0",
    name: "Amazon Nova Reel",
    description: "Amazon's text-to-video generation model",
    provider: "amazon",
    capabilities: {
      supportedAspectRatios: ["16:9"],
      supportedDurations: [6],
      costPerSecond: 0.08, // $0.08 per second
      averageProcessingTime: 300, // 5 minutes
    },
    schema: NovaReelConfigSchema,
    defaultConfig: {
      seed: 0,
    },
  },
  "kling-1.6": {
    id: "fal-ai/kling-video/v1.6/standard/text-to-video",
    name: "Kling 1.6",
    description: "Kling 1.6 text-to-video model",
    provider: "fal-ai",
    capabilities: {
      supportedAspectRatios: ["16:9", "9:16", "1:1"],
      supportedDurations: [5, 10],
      costPerSecond: 0.03,
      averageProcessingTime: 90, // 1.5 minutes
    },
    schema: FalKlingConfigSchema,
    defaultConfig: {
      duration: "5",
      aspect_ratio: "16:9",
    },
  },
  "pika-v2.2": {
    id: "fal-ai/pika/v2.2/text-to-video",
    name: "Pika 2.2",
    description: "Pika V2.2 text-to-video model",
    provider: "fal-ai",
    capabilities: {
      supportedAspectRatios: ["16:9", "9:16", "1:1"],
      supportedDurations: [5],
      costPerSecond: 0.08, // $0.04 per second
      averageProcessingTime: 90, // 1.5 minutes
    },
    schema: PikaV2ConfigSchema,
    defaultConfig: {
      resolution: "720p",
      negative_prompt: "",
      seed: 0,
      duration: "5",
      aspect_ratio: "16:9",
    },
  },
  "pixverse-v4": {
    id: "fal-ai/pixverse/v4/text-to-video",
    name: "Pixverse V4",
    description: "Pixverse V4 text-to-video model",
    provider: "fal-ai",
    capabilities: {
      supportedAspectRatios: ["16:9", "9:16", "1:1"],
      supportedDurations: [5, 8],
      costPerSecond: 0.04, // $0.04 per second
      averageProcessingTime: 90, // 1.5 minutes
    },
    schema: PixverseV4ConfigSchema,
    defaultConfig: {
      resolution: "720p",
      negative_prompt: "",
      seed: 0,
      duration: "5",
      aspect_ratio: "16:9",
    },
  },
};

// Helper function to get provider model config
export function getProviderModelConfig(modelId: string): ProviderModelConfig {
  const config = PROVIDER_MODELS[modelId];
  if (!config) {
    throw new Error(`Video provider model '${modelId}' not found`);
  }
  return config;
}

// Helper function to validate provider-specific config
export function validateProviderConfig(modelId: string, config: any): any {
  const providerConfig = getProviderModelConfig(modelId);

  // Merge with default config
  const mergedConfig = { ...providerConfig.defaultConfig, ...config };

  // Validate against schema
  return providerConfig.schema.parse(mergedConfig);
}

// Get all available providers (grouped by provider)
export function getAllProviders(): Record<string, string[]> {
  const providers: Record<string, string[]> = {};

  Object.entries(PROVIDER_MODELS).forEach(([modelId, config]) => {
    if (!providers[config.provider]) {
      providers[config.provider] = [];
    }
    providers[config.provider].push(modelId);
  });

  return providers;
}
