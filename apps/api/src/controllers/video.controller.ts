import { Context } from "hono";
import { VideoService } from "../services/video.service";
import { getAuth } from "@hono/clerk-auth";
import { getValidatedData } from "../utils/zodValidator";
import { z } from "zod";
import {
  CreateVideoSchema,
  GetVideoSignedUrlsSchema,
  CreateStoryboardSchema,
} from "../schemas/video.schema";

export class VideoController {
  private videoService: VideoService;

  constructor(videoService: VideoService) {
    this.videoService = videoService;
  }

  async createStoryboard(c: Context): Promise<Response> {
    try {
      const auth = getAuth(c);
      const userId = auth?.userId;

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const data = getValidatedData<z.infer<typeof CreateStoryboardSchema>>(c);
      const storyboard = await this.videoService.createStoryboard(
        data.inputConcept
      );

      return c.json(storyboard);
    } catch (error) {
      console.error("Error creating storyboard:", error);
      return c.json({ error: "Failed to create storyboard" }, 500);
    }
  }

  async createVideo(c: Context): Promise<Response> {
    try {
      const auth = getAuth(c);
      const userId = auth?.userId;

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const data = getValidatedData<z.infer<typeof CreateVideoSchema>>(c);
      const { voiceId, videoModel, providerConfig } = data;

      const result = await this.videoService.createVideo(
        userId,
        voiceId,
        videoModel,
        providerConfig
      );

      return c.json(result, 202);
    } catch (error) {
      console.error("Error creating video:", error);
      return c.json({ error: "Failed to create video" }, 500);
    }
  }

  /**
   * Get signed URLs for a video and its scenes
   * @param c - Hono context
   * @returns Response with signed URLs
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
        1
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
