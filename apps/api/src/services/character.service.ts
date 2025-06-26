import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";
import { db } from "../db";
import { characters, eq, and } from "@video-venture/shared/server";
import type { CharacterCreationRequest } from "../schemas/character.schema";
import sharp from "sharp";

export class CharacterService {
  private openai: OpenAI;
  private supabase: ReturnType<typeof createClient>;
  private storageBucket: string;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    this.storageBucket = process.env.SUPABASE_STORAGE_BUCKET!;
  }

  /**
   * Optimize image using Sharp
   * @param inputBuffer - Original image buffer
   * @param quality - Quality percentage (0-100)
   * @returns Optimized image buffer
   */
  private async optimizeImage(
    inputBuffer: Buffer,
    quality: number = 87
  ): Promise<Buffer> {
    try {
      console.log(
        "🖼️ [OPTIMIZE] Original image size:",
        inputBuffer.length,
        "bytes"
      );

      const optimizedBuffer = await sharp(inputBuffer)
        .resize(512, 512, {
          fit: "cover",
          position: "center",
        })
        .webp({
          quality,
          effort: 6, // Higher effort = better compression (0-6)
        })
        .toBuffer();

      const compressionRatio = (
        ((inputBuffer.length - optimizedBuffer.length) / inputBuffer.length) *
        100
      ).toFixed(1);
      console.log(
        "✅ [OPTIMIZE] Optimized image size:",
        optimizedBuffer.length,
        "bytes"
      );
      console.log("📉 [OPTIMIZE] Compression ratio:", compressionRatio + "%");

      return optimizedBuffer;
    } catch (error) {
      console.error("❌ [OPTIMIZE] Image optimization failed:", error);
      // Fallback to original if optimization fails
      return inputBuffer;
    }
  }

  async generateCharacter(
    characterData: CharacterCreationRequest,
    userId: string
  ): Promise<{ character: any; imageUrl: string; characterId: string }> {
    console.log("🎭 [CREATE] Starting character generation for user:", userId);

    try {
      // 1. Generate image with gpt-image-1
      const prompt = this.buildImagePrompt(characterData);
      console.log("🎨 [CREATE] Generated prompt:", prompt);

      const response = await this.openai.images.generate({
        model: "gpt-image-1",
        prompt,
        size: "1024x1024",
        quality: "medium",
        n: 1,
        output_format: "png",
        background: "auto",
      });

      // 2. Get base64 data
      const base64Image = response?.data?.[0]?.b64_json;
      if (!base64Image) {
        throw new Error("Failed to generate image - no base64 data returned");
      }

      // 3. Convert base64 to buffer
      const originalImageBuffer = Buffer.from(base64Image, "base64");
      console.log(
        "📸 [CREATE] Original PNG size:",
        originalImageBuffer.length,
        "bytes"
      );

      // 4. Optimize image (resize + convert to WebP)
      const optimizedImageBuffer = await this.optimizeImage(
        originalImageBuffer,
        87
      );

      const characterId = nanoid();

      // 5. Upload optimized image to Supabase Storage
      const storageKey = `${userId}/characters/${characterId}.webp`; // Changed to .webp
      console.log("📤 [CREATE] Uploading optimized image to:", storageKey);

      try {
        const uploadResult = await this.supabase.storage
          .from(this.storageBucket)
          .upload(storageKey, optimizedImageBuffer, {
            contentType: "image/webp", // Changed to WebP
            cacheControl: "31536000",
            upsert: false,
          });

        if (uploadResult.error) {
          throw new Error(
            `Supabase storage error: ${uploadResult.error.message}`
          );
        }
        console.log("✅ [CREATE] Successfully uploaded optimized image");
      } catch (uploadError) {
        console.error("❌ [CREATE] Upload exception:", uploadError);
        throw uploadError;
      }

      // 6. Get the public URL with cache-busting timestamp
      const { data: publicUrlData } = this.supabase.storage
        .from(this.storageBucket)
        .getPublicUrl(storageKey);

      const timestamp = Date.now();
      const imageUrlWithCacheBust = `${publicUrlData.publicUrl}?t=${timestamp}`;

      // 7. Save character to database
      const [savedCharacter] = await db
        .insert(characters)
        .values({
          id: characterId,
          userId,
          name: characterData.name,
          description: characterData.description,
          appearance: characterData.appearance,
          age: characterData.age,
          imageUrl: imageUrlWithCacheBust,
          storageKey,
        })
        .returning();

      console.log("✅ [CREATE] Character created successfully");

      return {
        character: savedCharacter,
        imageUrl: imageUrlWithCacheBust,
        characterId,
      };
    } catch (error) {
      console.error("❌ [CREATE] Character generation failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Character generation failed: ${errorMessage}`);
    }
  }

  async updateCharacter(
    characterId: string,
    characterData: CharacterCreationRequest,
    userId: string
  ): Promise<{ character: any; imageUrl: string }> {
    try {
      // 1. Get existing character
      const existingCharacter = await this.getCharacterById(
        characterId,
        userId
      );

      // 2. Generate new image
      const prompt = this.buildImagePrompt(characterData);
      console.log("🎨 [UPDATE] Updating character with prompt:", prompt);

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
        throw new Error("Failed to generate new image");
      }

      // 3. Optimize the new image
      const originalImageBuffer = Buffer.from(base64Image, "base64");
      const optimizedImageBuffer = await this.optimizeImage(
        originalImageBuffer,
        87
      );

      // 4. Upload optimized image (reuse same storage key)
      const { error: uploadError } = await this.supabase.storage
        .from(this.storageBucket)
        .upload(existingCharacter.storageKey, optimizedImageBuffer, {
          contentType: "image/webp",
          cacheControl: "31536000",
          upsert: true, // Allow overwrite
        });

      if (uploadError) {
        console.error("❌ [UPDATE] Failed to upload new image:", uploadError);
        throw new Error(`Failed to upload new image: ${uploadError.message}`);
      }

      // 5. Get public URL with cache-busting timestamp
      const { data: publicUrlData } = this.supabase.storage
        .from(this.storageBucket)
        .getPublicUrl(existingCharacter.storageKey);

      const timestamp = Date.now();
      const imageUrlWithCacheBust = `${publicUrlData.publicUrl}?t=${timestamp}`;

      // 6. Update character in database
      const [updatedCharacter] = await db
        .update(characters)
        .set({
          name: characterData.name,
          description: characterData.description,
          appearance: characterData.appearance,
          age: characterData.age,
          imageUrl: imageUrlWithCacheBust,
          updatedAt: new Date(),
        })
        .where(
          and(eq(characters.id, characterId), eq(characters.userId, userId))
        )
        .returning();

      if (!updatedCharacter) {
        throw new Error("Failed to update character in database");
      }

      console.log("✅ [UPDATE] Character updated successfully");

      return {
        character: updatedCharacter,
        imageUrl: imageUrlWithCacheBust,
      };
    } catch (error) {
      console.error("❌ [UPDATE] Character update error:", error);
      throw new Error("Failed to update character");
    }
  }

  async getCharacterById(characterId: string, userId: string) {
    const [character] = await db
      .select()
      .from(characters)
      .where(
        and(eq(characters.id, characterId), eq(characters.userId, userId))
      );

    if (!character) {
      throw new Error("Character not found");
    }

    return character;
  }

  async deleteCharacter(characterId: string, userId: string): Promise<void> {
    // 1. Get character to verify ownership and get storage key
    const character = await this.getCharacterById(characterId, userId);

    // 2. Delete from storage
    const { error: storageError } = await this.supabase.storage
      .from(this.storageBucket)
      .remove([character.storageKey]);

    if (storageError) {
      console.error("Failed to delete from storage:", storageError);
      // Continue with database deletion even if storage fails
    }

    // 3. Delete from database
    await db
      .delete(characters)
      .where(
        and(eq(characters.id, characterId), eq(characters.userId, userId))
      );
  }

  private buildImagePrompt(characterData: CharacterCreationRequest): string {
    let prompt = "";

    if (characterData.age) {
      prompt += `The age of the character age is: ${characterData.age}. `;
    }

    prompt += `The description of the character is: ${characterData.description}. `;

    if (characterData.appearance) {
      prompt += `Character features / appearance: ${characterData.appearance}. `;
    }

    prompt +=
      " Portrait orientation, centered composition, white background, high quality, no text.";

    return prompt;
  }
}
