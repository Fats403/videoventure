import { nanoid } from "nanoid";
import { db } from "../db";
import { characters, eq, and } from "@video-venture/shared/server";
import type { CharacterCreationRequest } from "../schemas/character.schema";
import { ImageProcessor } from "../modules/image-processor";
import { ClientFactory } from "../utils/client-factory";
import { createClient } from "@supabase/supabase-js";

export class CharacterService {
  private imageProcessor: ImageProcessor;
  private supabase: ReturnType<typeof createClient>;
  private storageBucket: string;

  constructor() {
    this.imageProcessor = new ImageProcessor();
    this.supabase = ClientFactory.getSupabase();
    this.storageBucket = process.env.SUPABASE_STORAGE_BUCKET!;
  }

  async generateCharacter(
    characterData: CharacterCreationRequest,
    userId: string
  ): Promise<{ character: any; imageUrl: string; characterId: string }> {
    console.log("🎭 [CREATE] Starting character generation for user:", userId);

    try {
      // 1. Generate and optimize image using the simplified module
      const prompt = this.buildImagePrompt(characterData);
      const optimizedImageBuffer =
        await this.imageProcessor.generateImage(prompt);

      const characterId = nanoid();

      // 2. Upload optimized image to Supabase Storage
      const storageKey = `${userId}/characters/${characterId}.webp`;
      console.log("📤 [CREATE] Uploading optimized image to:", storageKey);

      try {
        const uploadResult = await this.supabase.storage
          .from(this.storageBucket)
          .upload(storageKey, optimizedImageBuffer, {
            contentType: "image/webp",
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

      // 3. Get the public URL with cache-busting timestamp
      const { data: publicUrlData } = this.supabase.storage
        .from(this.storageBucket)
        .getPublicUrl(storageKey);

      const timestamp = Date.now();
      const imageUrlWithCacheBust = `${publicUrlData.publicUrl}?t=${timestamp}`;

      // 4. Save character to database
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

      // 2. Generate and optimize new image using the simplified module
      const prompt = this.buildImagePrompt(characterData);
      const optimizedImageBuffer =
        await this.imageProcessor.generateImage(prompt);

      // 3. Upload optimized image (reuse same storage key)
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

      // 4. Get public URL with cache-busting timestamp
      const { data: publicUrlData } = this.supabase.storage
        .from(this.storageBucket)
        .getPublicUrl(existingCharacter.storageKey);

      const timestamp = Date.now();
      const imageUrlWithCacheBust = `${publicUrlData.publicUrl}?t=${timestamp}`;

      // 5. Update character in database
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
      .where(and(eq(characters.id, characterId), eq(characters.userId, userId)))
      .limit(1);

    if (!character) {
      throw new Error("Character not found");
    }

    return character;
  }

  async deleteCharacter(characterId: string, userId: string): Promise<void> {
    try {
      const character = await this.getCharacterById(characterId, userId);

      // Delete from storage
      const { error: deleteError } = await this.supabase.storage
        .from(this.storageBucket)
        .remove([character.storageKey]);

      if (deleteError) {
        console.error(
          "❌ [DELETE] Failed to delete image from storage:",
          deleteError
        );
        // Continue with database deletion even if storage deletion fails
      }

      // Delete from database
      await db
        .delete(characters)
        .where(
          and(eq(characters.id, characterId), eq(characters.userId, userId))
        );

      console.log("✅ [DELETE] Character deleted successfully");
    } catch (error) {
      console.error("❌ [DELETE] Character deletion failed:", error);
      throw new Error("Failed to delete character");
    }
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
