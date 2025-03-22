import { Context } from "hono";
import { VideoService } from "../services/video.service";
import { getAuth } from "@hono/clerk-auth";
import { getValidatedData } from "../utils/zodValidator";
import { z } from "zod";
import {
  CreateVideoSchema,
  GetVideoSignedUrlsSchema,
} from "../schemas/video.schema";

export class VideoController {
  private videoService: VideoService;

  constructor(videoService: VideoService) {
    this.videoService = videoService;
  }

  async createVideo(c: Context): Promise<Response> {
    try {
      const auth = getAuth(c);
      const userId = auth?.userId || "7XJ6PTIzrhY5YNmkg5xO8OuGXme2";

      // Use the type-safe accessor with explicit generic type
      const data = getValidatedData<z.infer<typeof CreateVideoSchema>>(c);
      const { inputConcept, maxScenes, voiceId, videoModel, providerConfig } =
        data;

      const result = await this.videoService.createVideo(
        userId,
        inputConcept,
        maxScenes,
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
      const userId = auth?.userId || "7XJ6PTIzrhY5YNmkg5xO8OuGXme2";

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
