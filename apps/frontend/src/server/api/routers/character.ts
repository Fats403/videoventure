import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { env } from "@/env";
import { characters, eq, desc, and } from "@video-venture/shared/server";
import { handleApiError } from "@/server/utils/error-handler";

// Character creation/update schema
const characterInputSchema = z.object({
  name: z.string().min(1, "Character name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  appearance: z.string().optional(),
  age: z.string().optional(),
});

// Frontend-specific API response schemas (only needed for inference/validation here)
const apiCharacterResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  appearance: z.string().optional(),
  age: z.string().optional(),
  image: z.string().url(),
  createdAt: z.string(),
});

export const characterRouter = createTRPCRouter({
  // Get all user's characters
  getAll: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.db
        .select()
        .from(characters)
        .where(eq(characters.userId, ctx.session.userId))
        .orderBy(desc(characters.createdAt));
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch characters",
        cause: error,
      });
    }
  }),

  // Get character by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const [character] = await ctx.db
          .select()
          .from(characters)
          .where(
            and(
              eq(characters.id, input.id),
              eq(characters.userId, ctx.session.userId),
            ),
          );

        if (!character) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Character not found",
          });
        }

        return character;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch character",
          cause: error,
        });
      }
    }),

  // Create new character
  create: protectedProcedure
    .input(characterInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const token = await ctx.session.getToken();

        // Call the API to generate character
        const response = await fetch(
          `${env.NEXT_PUBLIC_SERVER_API_URL}/character/generate`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(input),
          },
        );

        if (!response.ok) {
          const errorData = (await response.json()) as unknown;
          handleApiError(errorData, "Failed to create character");
        }

        const responseData = (await response.json()) as unknown;
        const createdCharacter = apiCharacterResponseSchema.parse(responseData);

        // Return the character in the format expected by the frontend
        return {
          id: createdCharacter.id,
          name: createdCharacter.name,
          description: createdCharacter.description,
          appearance: createdCharacter.appearance ?? null,
          age: createdCharacter.age ?? null,
          imageUrl: createdCharacter.image,
          storageKey: "", // Not exposed to frontend
          createdAt: new Date(createdCharacter.createdAt),
          updatedAt: new Date(createdCharacter.createdAt),
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create character",
          cause: error,
        });
      }
    }),

  // Update existing character - now calls the API update endpoint
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: characterInputSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const token = await ctx.session.getToken();

        // Call the API to update character (regenerates image)
        const response = await fetch(
          `${env.NEXT_PUBLIC_SERVER_API_URL}/character/${input.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(input.data),
          },
        );

        if (!response.ok) {
          const errorData = (await response.json()) as unknown;

          if (response.status === 404) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Character not found",
            });
          }

          handleApiError(errorData, "Failed to update character");
        }

        const responseData = (await response.json()) as unknown;
        const updatedCharacterResponse =
          apiCharacterResponseSchema.parse(responseData);

        // Return in the format expected by the frontend
        return {
          id: updatedCharacterResponse.id,
          name: updatedCharacterResponse.name,
          description: updatedCharacterResponse.description,
          appearance: updatedCharacterResponse.appearance ?? null,
          age: updatedCharacterResponse.age ?? null,
          imageUrl: updatedCharacterResponse.image,
          storageKey: "", // Not exposed to frontend
          createdAt: new Date(updatedCharacterResponse.createdAt),
          updatedAt: new Date(),
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update character",
          cause: error,
        });
      }
    }),

  // Delete character
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const token = await ctx.session.getToken();

        // Call the API to delete character (handles both DB and storage cleanup)
        const response = await fetch(
          `${env.NEXT_PUBLIC_SERVER_API_URL}/character/${input.id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          const errorData = (await response.json()) as unknown;

          if (response.status === 404) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Character not found",
            });
          }

          handleApiError(errorData, "Failed to delete character");
        }

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete character",
          cause: error,
        });
      }
    }),
});
