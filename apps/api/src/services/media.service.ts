import OpenAI from "openai";
import { toFile } from "openai/uploads";
import sharp from "sharp";
import { SupabaseStorageService } from "@video-venture/shared/server";
import type { Character, AspectRatio } from "@video-venture/shared";

export class MediaService {
  private openai: OpenAI;
  private storage: SupabaseStorageService;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.storage = new SupabaseStorageService();
  }

  /**
   * Generate an image from a text prompt using GPT-Image-1
   */
  async generateImage(
    prompt: string,
    aspectRatio: AspectRatio = "1:1"
  ): Promise<Buffer> {
    console.log("🎨 [MEDIA-SERVICE] Generating image with prompt:", prompt);
    console.log("📐 [MEDIA-SERVICE] Aspect ratio:", aspectRatio);

    try {
      const imageSize = this.mapAspectRatioToSize(aspectRatio);

      const response = await this.openai.images.generate({
        model: "gpt-image-1",
        prompt,
        n: 1,
        size: imageSize,
        quality: "medium",
        response_format: "b64_json",
      });

      const base64Image = response.data?.[0]?.b64_json;
      if (!base64Image) {
        throw new Error("No image data returned from OpenAI");
      }

      const originalBuffer = Buffer.from(base64Image, "base64");
      const optimizedBuffer = await this.optimizeImage(
        originalBuffer,
        aspectRatio
      );

      console.log(
        "✅ [MEDIA-SERVICE] Image generated and optimized successfully"
      );
      return optimizedBuffer;
    } catch (error) {
      console.error("❌ [MEDIA-SERVICE] Image generation failed:", error);
      throw new Error(
        `Image generation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Generate scene image with character references
   */
  async generateSceneWithCharacters(
    prompt: string,
    characters: Character[],
    aspectRatio: AspectRatio = "1:1"
  ): Promise<Buffer> {
    console.log(
      "🎭 [MEDIA-SERVICE] Generating scene with",
      characters.length,
      "characters"
    );
    console.log("📐 [MEDIA-SERVICE] Aspect ratio:", aspectRatio);

    try {
      if (characters.length === 0) {
        return await this.generateImage(prompt, aspectRatio);
      }

      // Fetch character reference images
      const characterBuffers = await Promise.all(
        characters.map((char) => this.fetchCharacterImageBuffer(char))
      );

      // Convert character buffers to File objects for OpenAI
      const characterFiles = await Promise.all(
        characterBuffers.map(async (buffer, index) => {
          return await toFile(buffer, `character-${index + 1}.png`, {
            type: "image/png",
          });
        })
      );

      console.log(
        `✅ [MEDIA-SERVICE] Prepared ${characterFiles.length} character references`
      );

      const imageSize = this.mapAspectRatioToSize(aspectRatio);

      // Use OpenAI's image edit API to generate scene with character references
      const response = await this.openai.images.edit({
        model: "gpt-image-1",
        image: characterFiles,
        prompt,
        size: imageSize,
        quality: "medium",
        response_format: "b64_json",
      });

      const base64Image = response?.data?.[0]?.b64_json;
      if (!base64Image) {
        throw new Error("Failed to generate scene - no base64 data returned");
      }

      const originalBuffer = Buffer.from(base64Image, "base64");
      const optimizedBuffer = await this.optimizeImage(
        originalBuffer,
        aspectRatio
      );

      console.log(
        "✅ [MEDIA-SERVICE] Scene with characters generated successfully"
      );
      return optimizedBuffer;
    } catch (error) {
      console.error("❌ [MEDIA-SERVICE] Scene generation failed:", error);
      throw new Error(
        `Scene generation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Upload image buffer to storage and return public URL
   */
  async uploadImage(imageBuffer: Buffer, storageKey: string): Promise<string> {
    try {
      console.log(`📤 [MEDIA-SERVICE] Uploading image: ${storageKey}`);

      const imageUrl = await this.storage.uploadBuffer(
        imageBuffer,
        storageKey,
        "image/webp"
      );

      const timestamp = Date.now();
      const imageUrlWithCacheBust = `${imageUrl}?t=${timestamp}`;

      console.log(
        "✅ [MEDIA-SERVICE] Image uploaded successfully:",
        imageUrlWithCacheBust
      );
      return imageUrlWithCacheBust;
    } catch (error) {
      console.error("❌ [MEDIA-SERVICE] Failed to upload image:", error);
      throw error;
    }
  }

  /**
   * Map aspect ratio to GPT-Image-1 size parameter
   */
  private mapAspectRatioToSize(
    aspectRatio: AspectRatio
  ): "1024x1024" | "1536x1024" | "1024x1536" {
    switch (aspectRatio) {
      case "16:9":
        return "1536x1024"; // Landscape
      case "1:1":
        return "1024x1024"; // Square
      case "9:16":
        return "1024x1536"; // Portrait
      default:
        return "1024x1024"; // Default to square
    }
  }

  /**
   * Optimize image buffer (convert to WebP and compress)
   */
  private async optimizeImage(
    buffer: Buffer,
    aspectRatio: AspectRatio
  ): Promise<Buffer> {
    try {
      // Get target dimensions based on aspect ratio
      const { width, height } = this.getTargetDimensions(aspectRatio);

      return await sharp(buffer)
        .webp({ quality: 85, effort: 4 })
        .resize(width, height, { fit: "inside", withoutEnlargement: true })
        .toBuffer();
    } catch (error) {
      console.error("❌ [MEDIA-SERVICE] Image optimization failed:", error);
      throw new Error("Failed to optimize image");
    }
  }

  /**
   * Get target dimensions for optimization based on aspect ratio
   */
  private getTargetDimensions(aspectRatio: AspectRatio): {
    width: number;
    height: number;
  } {
    switch (aspectRatio) {
      case "16:9":
        return { width: 1536, height: 1024 };
      case "1:1":
        return { width: 1024, height: 1024 };
      case "9:16":
        return { width: 1024, height: 1536 };
      default:
        return { width: 1024, height: 1024 };
    }
  }

  /**
   * Fetch character image from storage as buffer
   */
  private async fetchCharacterImageBuffer(
    character: Character
  ): Promise<Buffer> {
    try {
      if (!character.storageKey) {
        throw new Error(`Character ${character.name} has no storage key`);
      }

      console.log(
        `📥 [MEDIA-SERVICE] Downloading character image: ${character.storageKey}`
      );
      return await this.storage.downloadAsBuffer(character.storageKey);
    } catch (error) {
      console.error(
        `❌ [MEDIA-SERVICE] Failed to fetch character image for ${character.name}:`,
        error
      );
      throw error;
    }
  }
}
