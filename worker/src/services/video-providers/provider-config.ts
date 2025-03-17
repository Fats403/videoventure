import { z } from "zod";

// Provider capability interface
export interface ProviderCapabilities {
  supportedAspectRatios: string[];
  supportedResolutions: string[];
  supportedDurations: number[];
  supportedFeatures: string[];
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

// Define Fal.ai LTX schema
export const FalLtxConfigSchema = z.object({
  negative_prompt: z.string().optional(),
  resolution: z.enum(["480p", "720p"]).optional(),
  aspect_ratio: z.enum(["16:9", "9:16"]).optional(),
  seed: z.number().optional(),
  num_inference_steps: z.number().optional(),
  expand_prompt: z.boolean().optional(),
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
      supportedResolutions: ["1280x720"],
      supportedDurations: [6],
      supportedFeatures: ["seed"],
      costPerSecond: 0.019, // $0.019 per second
      averageProcessingTime: 120, // 2 minutes
    },
    schema: NovaReelConfigSchema,
    defaultConfig: {
      seed: 0,
    },
  },
  "fal-kling": {
    id: "fal-ai/kling-video/v1.6/standard/text-to-video",
    name: "Fal.ai Kling",
    description: "Fal.ai's Kling text-to-video model",
    provider: "fal-ai",
    capabilities: {
      supportedAspectRatios: ["16:9", "9:16", "1:1"],
      supportedResolutions: ["720p"],
      supportedDurations: [5, 10],
      supportedFeatures: ["camera_control"],
      costPerSecond: 0.025, // $0.025 per second
      averageProcessingTime: 90, // 1.5 minutes
    },
    schema: FalKlingConfigSchema,
    defaultConfig: {
      duration: "5",
      aspect_ratio: "16:9",
    },
  },
  "fal-ltx": {
    id: "fal-ai/ltx-video/image-to-video",
    name: "Fal.ai LTX",
    description: "Fal.ai's LTX text-to-video model",
    provider: "fal-ai",
    capabilities: {
      supportedAspectRatios: ["16:9", "9:16"],
      supportedResolutions: ["480p", "720p"],
      supportedDurations: [3], // Fixed duration
      supportedFeatures: [
        "negative_prompt",
        "seed",
        "num_inference_steps",
        "expand_prompt",
      ],
      costPerSecond: 0.03, // $0.03 per second
      averageProcessingTime: 60, // 1 minute
    },
    schema: FalLtxConfigSchema,
    defaultConfig: {
      negative_prompt:
        "worst quality, inconsistent motion, blurry, jittery, distorted",
      resolution: "720p",
      aspect_ratio: "16:9",
      num_inference_steps: 40,
      expand_prompt: true,
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
