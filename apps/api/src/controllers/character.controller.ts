import { CharacterService } from "../services/character.service";
import type {
  CharacterCreationRequest,
  CharacterCreationResponse,
} from "../schemas/character.schema";

export class CharacterController {
  constructor(private characterService: CharacterService) {}

  async generateCharacter(
    characterData: CharacterCreationRequest,
    userId: string
  ): Promise<CharacterCreationResponse> {
    const { character, imageUrl, characterId } =
      await this.characterService.generateCharacter(characterData, userId);

    return {
      id: characterId,
      name: characterData.name,
      description: characterData.description,
      appearance: characterData.appearance,
      age: characterData.age,
      image: imageUrl,
      createdAt: character.createdAt.toISOString(),
    };
  }

  async deleteCharacter(characterId: string, userId: string) {
    await this.characterService.deleteCharacter(characterId, userId);
    return { success: true, message: "Character deleted successfully" };
  }

  async updateCharacter(
    characterId: string,
    characterData: CharacterCreationRequest,
    userId: string
  ): Promise<CharacterCreationResponse> {
    const { character, imageUrl } = await this.characterService.updateCharacter(
      characterId,
      characterData,
      userId
    );

    return {
      id: characterId,
      name: characterData.name,
      description: characterData.description,
      appearance: characterData.appearance,
      age: characterData.age,
      image: imageUrl,
      createdAt: character.createdAt.toISOString(),
    };
  }
}
