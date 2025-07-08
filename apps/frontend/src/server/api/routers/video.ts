import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  conceptDataSchema,
  storyboardSchema,
  storyboardDataSchema,
  settingsDataSchema,
  breakdownDataSchema,
} from "@video-venture/shared";
import {
  videoProjects,
  characters,
  eq,
  desc,
} from "@video-venture/shared/server";
import { TRPCError } from "@trpc/server";
import { createProjectResponseSchema } from "@/lib/zod/create-video";
import type { Storyboard } from "@video-venture/shared";
import { env } from "@/env";

export const videoRouter = createTRPCRouter({
  // Create a new video project with storyboard generation
  create: protectedProcedure
    .input(conceptDataSchema)
    .output(createProjectResponseSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const token = await ctx.session.getToken();

        // Generate storyboard variants inline
        const storyboardResponse = await fetch(
          `${env.NEXT_PUBLIC_SERVER_API_URL}/storyboard/variants`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(input),
          },
        );

        if (!storyboardResponse.ok) {
          throw new Error(
            `Storyboard API request failed: ${storyboardResponse.status} ${storyboardResponse.statusText}`,
          );
        }

        const storyboardVariants =
          (await storyboardResponse.json()) as Storyboard[];

        // Create project with both concept and storyboard
        const [project] = await ctx.db
          .insert(videoProjects)
          .values({
            userId: ctx.session.userId,
            status: "storyboard",
            concept: input,
            storyboard: {
              variants: storyboardVariants,
            },
          })
          .returning();

        if (!project) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create project",
          });
        }

        return {
          projectId: project.id,
          storyboardVariants,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create project and generate storyboard",
          cause: error,
        });
      }
    }),

  // Generate additional storyboard variant
  generateAdditionalVariant: protectedProcedure
    .input(conceptDataSchema)
    .output(storyboardSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const token = await ctx.session.getToken();

        // Generate additional storyboard variant
        const storyboardResponse = await fetch(
          `${env.NEXT_PUBLIC_SERVER_API_URL}/storyboard/variant/additional`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(input),
          },
        );

        if (!storyboardResponse.ok) {
          throw new Error(
            `Additional variant API request failed: ${storyboardResponse.status} ${storyboardResponse.statusText}`,
          );
        }

        const additionalVariant =
          (await storyboardResponse.json()) as Storyboard;

        // TODO: Store the additional variant in the database

        return additionalVariant;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate additional storyboard variant",
          cause: error,
        });
      }
    }),

  // Update project storyboard
  updateStoryboard: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        storyboard: storyboardDataSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.query.videoProjects.findFirst({
        where: eq(videoProjects.id, input.projectId),
      });

      if (!project || project.userId !== ctx.session.userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      await ctx.db
        .update(videoProjects)
        .set({
          storyboard: input.storyboard,
          status: "settings",
          updatedAt: new Date(),
        })
        .where(eq(videoProjects.id, input.projectId));

      // TODO: Get characters and project name from storyboard

      return { success: true };
    }),

  // Replace updateSettings with updateSettingsAndGenerateBreakdown
  updateSettingsAndGenerateBreakdown: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        settings: settingsDataSchema,
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        breakdown: breakdownDataSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // First, get the project to ensure it exists and get storyboard
        const project = await ctx.db.query.videoProjects.findFirst({
          where: eq(videoProjects.id, input.projectId),
        });

        if (!project || project.userId !== ctx.session.userId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Project not found",
          });
        }

        if (!project.storyboard) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Project must have storyboard to generate breakdown",
          });
        }

        // Update settings first
        await ctx.db
          .update(videoProjects)
          .set({
            settings: input.settings,
            projectName: input.settings.projectName,
            updatedAt: new Date(),
          })
          .where(eq(videoProjects.id, input.projectId));

        // Get user's characters to include in the breakdown
        const userCharacters = await ctx.db.query.characters.findMany({
          where: eq(characters.userId, ctx.session.userId),
        });

        // Filter characters based on settings selection
        const selectedCharacterIds = input.settings.characters ?? [];
        const selectedCharacters = userCharacters.filter((char) =>
          selectedCharacterIds.includes(char.id),
        );

        const token = await ctx.session.getToken();

        // Call the breakdown API
        const breakdownResponse = await fetch(
          `${env.NEXT_PUBLIC_SERVER_API_URL}/storyboard/breakdown`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              storyboard: project.storyboard,
              settings: input.settings,
              characters:
                selectedCharacters.length > 0 ? selectedCharacters : undefined,
              projectId: input.projectId,
            }),
          },
        );

        if (!breakdownResponse.ok) {
          throw new Error(
            `Breakdown API request failed: ${breakdownResponse.status} ${breakdownResponse.statusText}`,
          );
        }

        const breakdown =
          (await breakdownResponse.json()) as typeof breakdownDataSchema._type;

        // Update the project with the breakdown and set status to breakdown
        await ctx.db
          .update(videoProjects)
          .set({
            breakdown,
            status: "breakdown",
            updatedAt: new Date(),
          })
          .where(eq(videoProjects.id, input.projectId));

        return {
          success: true,
          breakdown,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update settings and generate breakdown",
          cause: error,
        });
      }
    }),

  // Update project breakdown and start generation
  updateBreakdownAndGenerate: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        breakdown: breakdownDataSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.query.videoProjects.findFirst({
        where: eq(videoProjects.id, input.projectId),
      });

      if (!project || project.userId !== ctx.session.userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      // Update with breakdown data and set status to generating
      await ctx.db
        .update(videoProjects)
        .set({
          breakdown: input.breakdown,
          status: "generating",
          updatedAt: new Date(),
        })
        .where(eq(videoProjects.id, input.projectId));

      // TODO: Start video generation job
      // This would call your video generation service

      return { success: true };
    }),

  // Get user's projects
  getMyProjects: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.videoProjects.findMany({
      where: eq(videoProjects.userId, ctx.session.userId),
      orderBy: desc(videoProjects.createdAt),
    });
  }),

  // Get specific project
  getProject: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.query.videoProjects.findFirst({
        where: eq(videoProjects.id, input.id),
      });

      if (!project || project.userId !== ctx.session.userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      return project;
    }),
});
