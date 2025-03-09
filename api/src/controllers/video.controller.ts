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
      const { storyIdea, maxScenes, voiceId } = await c.req.json();

      const result = await this.videoService.createVideo(
        userId,
        storyIdea,
        maxScenes,
        voiceId
      );

      return c.json(result, 202);
    } catch (error) {
      console.error("Error creating video:", error);
      return c.json({ error: "Failed to create video" }, 500);
    }
  }

  async getJobStatus(c: Context): Promise<Response> {
    try {
      const jobId = c.req.param("jobId");
      const job = await this.videoService.getJobStatus(jobId);
      return c.json(job);
    } catch (error: any) {
      if (error.message === "Job not found") {
        return c.json({ error: "Job not found" }, 404);
      }
      console.error("Error getting job:", error);
      return c.json({ error: "Failed to get job status" }, 500);
    }
  }
}
