import { nanoid } from "nanoid";
import { db } from "../db";
import { characters, eq, and } from "@video-venture/shared/server";
import type { CharacterCreationRequest } from "../schemas/character.schema";
import { MediaService } from "./media.service";
import { SupabaseStorageService } from "@video-venture/shared/server";

export class CharacterService {
  private mediaService: MediaService;
  private storage: SupabaseStorageService;

  constructor() {
    this.mediaService = new MediaService();
    this.storage = new SupabaseStorageService();
  }

  async generateCharacter(
    characterData: CharacterCreationRequest,
    userId: string
  ): Promise<{ character: any; imageUrl: string; characterId: string }> {
    console.log(
      "🎭 [CHARACTER-SERVICE] Starting character generation for user:",
      userId
    );

    try {
      const characterId = nanoid();

      // 1. Generate and optimize image (characters are always square for consistency)
      const prompt = this.buildImagePrompt(characterData);
      const optimizedImageBuffer = await this.mediaService.generateImage(
        prompt,
        "1:1"
      );

      // 2. Upload to storage using new path structure
      const storageKey = this.storage.getCharacterImagePath(
        userId,
        characterId
      );
      const imageUrl = await this.mediaService.uploadImage(
        optimizedImageBuffer,
        storageKey
      );

      // 3. Save character to database
      const [savedCharacter] = await db
        .insert(characters)
        .values({
          id: characterId,
          userId,
          name: characterData.name,
          description: characterData.description,
          appearance: characterData.appearance,
          age: characterData.age,
          imageUrl,
          storageKey,
        })
        .returning();

      console.log("✅ [CHARACTER-SERVICE] Character created successfully");

      return {
        character: savedCharacter,
        imageUrl,
        characterId,
      };
    } catch (error) {
      console.error(
        "❌ [CHARACTER-SERVICE] Character generation failed:",
        error
      );
      throw new Error(
        `Character generation failed: ${error instanceof Error ? error.message : String(error)}`
      );
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

      // 2. Generate new image (characters are always square for consistency)
      const prompt = this.buildImagePrompt(characterData);
      const optimizedImageBuffer = await this.mediaService.generateImage(
        prompt,
        "1:1"
      );

      // 3. Upload new image (reuse same storage key)
      const imageUrl = await this.mediaService.uploadImage(
        optimizedImageBuffer,
        existingCharacter.storageKey
      );

      // 4. Update character in database
      const [updatedCharacter] = await db
        .update(characters)
        .set({
          name: characterData.name,
          description: characterData.description,
          appearance: characterData.appearance,
          age: characterData.age,
          imageUrl,
          updatedAt: new Date(),
        })
        .where(
          and(eq(characters.id, characterId), eq(characters.userId, userId))
        )
        .returning();

      if (!updatedCharacter) {
        throw new Error("Failed to update character in database");
      }

      console.log("✅ [CHARACTER-SERVICE] Character updated successfully");

      return {
        character: updatedCharacter,
        imageUrl,
      };
    } catch (error) {
      console.error("❌ [CHARACTER-SERVICE] Character update error:", error);
      throw new Error("Failed to update character");
    }
  }

  async deleteCharacter(characterId: string, userId: string): Promise<void> {
    try {
      const character = await this.getCharacterById(characterId, userId);

      // Delete from storage
      await this.storage.deleteFile(character.storageKey);

      // Delete from database
      await db
        .delete(characters)
        .where(
          and(eq(characters.id, characterId), eq(characters.userId, userId))
        );

      console.log("✅ [CHARACTER-SERVICE] Character deleted successfully");
    } catch (error) {
      console.error("❌ [CHARACTER-SERVICE] Character deletion failed:", error);
      throw new Error("Failed to delete character");
    }
  }

  private async getCharacterById(characterId: string, userId: string) {
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

  private buildImagePrompt(characterData: CharacterCreationRequest): string {
    let prompt = "";

    if (characterData.age) {
      prompt += `The age of the character is: ${characterData.age}. `;
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
