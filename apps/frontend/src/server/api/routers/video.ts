import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { videoProjects, eq, desc } from "@video-venture/shared";
import { TRPCError } from "@trpc/server";
import {
  conceptDataSchema,
  createProjectResponseSchema,
  projectStatusSchema,
} from "@/lib/zod/database";
import { generateStoryboardVariants } from "@/lib/api/storyboard";

export const videoRouter = createTRPCRouter({
  // Create a new video project with storyboard generation
  create: protectedProcedure
    .input(conceptDataSchema)
    .output(createProjectResponseSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const token = await ctx.session.getToken();
        const storyboardVariants = await generateStoryboardVariants(
          token,
          input,
        );

        console.log(storyboardVariants);

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

  // Update project (for any step)
  updateProject: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          projectName: z.string().optional(),
          status: projectStatusSchema.optional(),
          concept: conceptDataSchema.optional(),
          storyboard: z.any().optional(),
          settings: z.any().optional(),
          breakdown: z.any().optional(),
          video: z.any().optional(),
          videoModel: z
            .enum(["standard", "cinematic", "experimental"])
            .optional(),
          aspectRatio: z.enum(["16:9", "1:1", "9:16"]).optional(),
          duration: z.number().optional(),
          sceneCount: z.number().optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input;

      // Verify ownership
      const existingProject = await ctx.db.query.videoProjects.findFirst({
        where: eq(videoProjects.id, id),
      });

      if (!existingProject || existingProject.userId !== ctx.session.userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      // Update project
      const [updatedProject] = await ctx.db
        .update(videoProjects)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(videoProjects.id, id))
        .returning();

      return updatedProject;
    }),
});
