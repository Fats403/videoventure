import OpenAI, { toFile } from "openai";
import sharp from "sharp";
import { ClientFactory } from "../utils/client-factory";
import { createClient } from "@supabase/supabase-js";
import type { Character } from "@video-venture/shared";

export class ImageProcessor {
  private openai: OpenAI;
  private supabase: ReturnType<typeof createClient>;
  private storageBucket: string;

  constructor() {
    this.openai = ClientFactory.getOpenAI();
    this.supabase = ClientFactory.getSupabase();
    this.storageBucket = process.env.SUPABASE_STORAGE_BUCKET!;
  }

  /**
   * Generate image from text prompt and return optimized buffer
   * @param prompt - Text prompt for image generation
   * @returns Optimized image buffer
   */
  async generateImage(prompt: string): Promise<Buffer> {
    console.log("🎨 [IMAGE-PROCESSOR] Generating image with prompt:", prompt);

    try {
      const response = await this.openai.images.generate({
        model: "gpt-image-1",
        prompt,
        size: "1024x1024",
        quality: "medium",
        n: 1,
        output_format: "png",
        background: "auto",
      });

      const base64Image = response?.data?.[0]?.b64_json;
      if (!base64Image) {
        throw new Error("Failed to generate image - no base64 data returned");
      }

      // Convert base64 to buffer and optimize
      const originalBuffer = Buffer.from(base64Image, "base64");
      const optimizedBuffer = await this.optimizeImage(originalBuffer);

      console.log(
        "✅ [IMAGE-PROCESSOR] Image generated and optimized successfully"
      );
      return optimizedBuffer;
    } catch (error) {
      console.error("❌ [IMAGE-PROCESSOR] Image generation failed:", error);
      throw new Error(
        `Image generation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Generate scene image with character references using a provided prompt
   * @param prompt - Complete prompt for scene generation
   * @param characters - Array of character objects to fetch reference images for
   * @returns Optimized image buffer
   */
  async generateSceneWithCharacters(
    prompt: string,
    characters: Character[]
  ): Promise<Buffer> {
    console.log(
      "🎭 [IMAGE-PROCESSOR] Generating scene with",
      characters.length,
      "characters"
    );
    console.log("🎨 [IMAGE-PROCESSOR] Scene prompt:", prompt);

    try {
      if (characters.length === 0) {
        // No characters, just generate the scene
        return await this.generateImage(prompt);
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
        `✅ [IMAGE-PROCESSOR] Prepared ${characterFiles.length} character references`
      );

      // Use OpenAI's image edit API to generate scene with character references
      const response = await this.openai.images.edit({
        model: "gpt-image-1",
        image: characterFiles,
        prompt,
      });

      const base64Image = response?.data?.[0]?.b64_json;
      if (!base64Image) {
        throw new Error("Failed to generate scene - no base64 data returned");
      }

      // Convert base64 to buffer and optimize
      const originalBuffer = Buffer.from(base64Image, "base64");
      const optimizedBuffer = await this.optimizeImage(originalBuffer);

      console.log(
        "✅ [IMAGE-PROCESSOR] Scene with characters generated successfully"
      );
      return optimizedBuffer;
    } catch (error) {
      console.error("❌ [IMAGE-PROCESSOR] Scene generation failed:", error);
      throw new Error(
        `Scene generation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Upload image buffer to Supabase storage and return public URL
   * @param imageBuffer - Image buffer to upload
   * @param storageKey - Storage key/path for the image
   * @returns Public URL of uploaded image
   */
  async uploadImageToStorage(
    imageBuffer: Buffer,
    storageKey: string
  ): Promise<string> {
    try {
      console.log(`📤 [IMAGE-PROCESSOR] Uploading image: ${storageKey}`);

      const { error: uploadError } = await this.supabase.storage
        .from(this.storageBucket)
        .upload(storageKey, imageBuffer, {
          contentType: "image/webp",
          cacheControl: "31536000",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      // Get public URL
      const { data: publicUrlData } = this.supabase.storage
        .from(this.storageBucket)
        .getPublicUrl(storageKey);

      const timestamp = Date.now();
      const imageUrlWithCacheBust = `${publicUrlData.publicUrl}?t=${timestamp}`;

      console.log(
        `✅ [IMAGE-PROCESSOR] Image uploaded successfully: ${imageUrlWithCacheBust}`
      );
      return imageUrlWithCacheBust;
    } catch (error) {
      console.error(`❌ [IMAGE-PROCESSOR] Failed to upload image:`, error);
      throw error;
    }
  }

  /**
   * Fetch character image from Supabase storage as buffer
   * @param character - Character object with storage key
   * @returns Image buffer
   */
  private async fetchCharacterImageBuffer(
    character: Character
  ): Promise<Buffer> {
    try {
      if (!character.storageKey) {
        throw new Error(`Character ${character.name} has no storage key`);
      }

      console.log(
        `📥 [IMAGE-PROCESSOR] Downloading character image: ${character.storageKey}`
      );

      const { data, error } = await this.supabase.storage
        .from(this.storageBucket)
        .download(character.storageKey);

      if (error) {
        throw new Error(`Failed to download character image: ${error.message}`);
      }

      if (!data) {
        throw new Error(`No data returned for character ${character.name}`);
      }

      // Convert Blob to Buffer
      const arrayBuffer = await data.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error(
        `❌ [IMAGE-PROCESSOR] Failed to fetch character image for ${character.name}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Edit/compose images using reference image buffers and a prompt
   * @param prompt - Text prompt for image editing/composition
   * @param referenceImageBuffers - Array of image buffers to use as references
   * @returns Optimized image buffer
   */
  async editImagesWithReferences(
    prompt: string,
    referenceImageBuffers: Buffer[]
  ): Promise<Buffer> {
    console.log(
      "🖼️ [IMAGE-PROCESSOR] Editing images with",
      referenceImageBuffers.length,
      "references"
    );
    console.log("🎨 [IMAGE-PROCESSOR] Edit prompt:", prompt);

    try {
      // Convert buffers to File objects for OpenAI
      const imageFiles = await Promise.all(
        referenceImageBuffers.map(async (buffer, index) => {
          return await toFile(buffer, `reference-${index + 1}.png`, {
            type: "image/png",
          });
        })
      );

      console.log(
        `✅ [IMAGE-PROCESSOR] Prepared ${imageFiles.length} reference images`
      );

      // Use OpenAI's image edit API with multiple reference images
      const response = await this.openai.images.edit({
        model: "gpt-image-1",
        image: imageFiles,
        prompt,
      });

      const base64Image = response?.data?.[0]?.b64_json;
      if (!base64Image) {
        throw new Error("Failed to edit images - no base64 data returned");
      }

      // Convert base64 to buffer and optimize
      const originalBuffer = Buffer.from(base64Image, "base64");
      const optimizedBuffer = await this.optimizeImage(originalBuffer);

      console.log(
        "✅ [IMAGE-PROCESSOR] Images edited and optimized successfully"
      );
      return optimizedBuffer;
    } catch (error) {
      console.error("❌ [IMAGE-PROCESSOR] Image editing failed:", error);
      throw new Error(
        `Image editing failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Optimize image buffer (resize to 512x512 WebP with 87% quality)
   * @param inputBuffer - Original image buffer
   * @returns Optimized image buffer
   */
  private async optimizeImage(inputBuffer: Buffer): Promise<Buffer> {
    try {
      console.log(
        "🖼️ [IMAGE-PROCESSOR] Original image size:",
        inputBuffer.length,
        "bytes"
      );

      const optimizedBuffer = await sharp(inputBuffer)
        .resize(512, 512, {
          fit: "cover",
          position: "center",
        })
        .webp({
          quality: 87,
          effort: 6,
        })
        .toBuffer();

      const compressionRatio = (
        ((inputBuffer.length - optimizedBuffer.length) / inputBuffer.length) *
        100
      ).toFixed(1);

      console.log(
        "✅ [IMAGE-PROCESSOR] Optimized image size:",
        optimizedBuffer.length,
        "bytes"
      );
      console.log(
        "📉 [IMAGE-PROCESSOR] Compression ratio:",
        compressionRatio + "%"
      );

      return optimizedBuffer;
    } catch (error) {
      console.error("❌ [IMAGE-PROCESSOR] Image optimization failed:", error);
      // Fallback to original if optimization fails
      return inputBuffer;
    }
  }
}
