import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  videoProjects,
  eq,
  desc,
  conceptDataSchema,
} from "@video-venture/shared";
import { TRPCError } from "@trpc/server";
import { createProjectResponseSchema } from "@/lib/zod/create-video";
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
});
