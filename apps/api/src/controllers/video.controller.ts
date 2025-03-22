import { Context } from "hono";
import { VideoService } from "../services/video.service";

export class VideoController {
  private videoService: VideoService;

  constructor(videoService: VideoService) {
    this.videoService = videoService;
  }

  async createVideo(c: Context): Promise<Response> {
    try {
      const userId = c.var.userId;
      const { inputConcept, maxScenes, voiceId, videoModel, providerConfig } =
        await c.req.json();

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
      const userId = c.var.userId;
      const version = 1;
      const { videoId } = await c.req.json();

      const result = await this.videoService.getVideoSignedUrls(
        userId,
        videoId,
        version
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
