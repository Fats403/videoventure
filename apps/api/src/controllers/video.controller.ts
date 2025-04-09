import { Context } from "hono";
import { VideoService } from "../services/video.service";
import { getAuth } from "@hono/clerk-auth";
import { getValidatedData } from "../utils/zodValidator";
import { z } from "zod";
import {
  CreateStoryboardSchema,
  GetVideoSignedUrlsSchema,
  UpdateVideoDetailsSchema,
  StartVideoJobSchema,
} from "../schemas/video.schema";

export class VideoController {
  private videoService: VideoService;

  constructor(videoService: VideoService) {
    this.videoService = videoService;
  }

  /**
   * Create a new video document with storyboard
   */
  async createVideo(c: Context): Promise<Response> {
    try {
      const auth = getAuth(c);
      const userId = auth?.userId;

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const data = getValidatedData<z.infer<typeof CreateStoryboardSchema>>(c);
      const result = await this.videoService.createVideo(
        data.inputConcept,
        userId
      );

      return c.json(result);
    } catch (error) {
      console.error("Error creating video:", error);
      return c.json({ error: "Failed to create video" }, 500);
    }
  }

  /**
   * Update video details
   */
  async updateVideoDetails(c: Context): Promise<Response> {
    try {
      const auth = getAuth(c);
      const userId = auth?.userId;

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const data =
        getValidatedData<z.infer<typeof UpdateVideoDetailsSchema>>(c);
      const { videoId, ...updates } = data;

      const result = await this.videoService.updateVideoDetails(
        userId,
        videoId,
        updates
      );

      return c.json(result);
    } catch (error: any) {
      console.error("Error updating video details:", error);

      if (error.message?.includes("not found")) {
        return c.json({ error: error.message }, 404);
      }

      if (error.message?.includes("Unauthorized")) {
        return c.json({ error: error.message }, 403);
      }

      return c.json({ error: "Failed to update video details" }, 500);
    }
  }

  /**
   * Start video creation job
   */
  async startVideoJob(c: Context): Promise<Response> {
    try {
      const auth = getAuth(c);
      const userId = auth?.userId;

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const data = getValidatedData<z.infer<typeof StartVideoJobSchema>>(c);

      const result = await this.videoService.startVideoJob(
        userId,
        data.videoId
      );

      return c.json(result, 202);
    } catch (error: any) {
      console.error("Error starting video job:", error);

      if (error.message?.includes("not found")) {
        return c.json({ error: error.message }, 404);
      }

      if (error.message?.includes("Unauthorized")) {
        return c.json({ error: error.message }, 403);
      }

      if (error.message?.includes("already being processed")) {
        return c.json({ error: error.message }, 409);
      }

      return c.json({ error: "Failed to start video job" }, 500);
    }
  }

  /**
   * Get signed URLs for a video and its scenes
   */
  async getVideoSignedUrls(c: Context): Promise<Response> {
    try {
      const auth = getAuth(c);
      const userId = auth?.userId;

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const data =
        getValidatedData<z.infer<typeof GetVideoSignedUrlsSchema>>(c);

      const result = await this.videoService.getVideoSignedUrls(
        userId,
        data.videoId,
        data.version
      );

      return c.json(result);
    } catch (error: any) {
      console.error("Error generating signed URLs:", error);
      if (error.message?.includes("not found")) {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: "Failed to generate signed URLs" }, 500);
    }
  }
}
