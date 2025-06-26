import { characterSchema } from "@video-venture/shared";
import { z } from "zod";

export const CharacterCreationRequestSchema = z.object({
  name: z.string().min(1, "Character name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  appearance: z.string().optional(),
  age: z.string().optional(),
});

export const CharacterCreationResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  appearance: z.string().optional(),
  age: z.string().optional(),
  image: z.string().url(),
  createdAt: z.string(),
});

export const CharacterListResponseSchema = z.object({
  characters: z.array(characterSchema),
});

export type CharacterCreationRequest = z.infer<
  typeof CharacterCreationRequestSchema
>;

export type CharacterCreationResponse = z.infer<
  typeof CharacterCreationResponseSchema
>;
