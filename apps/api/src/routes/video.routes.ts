import { Hono } from "hono";
import { VideoController } from "../controllers/video.controller";
import { validate } from "../middleware/validate";
import {
  CreateVideoSchema,
  GetVideoSignedUrlsSchema,
} from "../schemas/video.schema";

export const createVideoRoutes = (
  app: Hono<{ Variables: { userId: string } }>,
  videoController: VideoController
) => {
  // Create a new video
  app.post("/api/videos", validate(CreateVideoSchema, "json"), (c) =>
    videoController.createVideo(c)
  );

  // Get signed URLs for a video and its scenes
  app.get(
    "/api/videos/:videoId/signed-urls",
    validate(GetVideoSignedUrlsSchema, "json"),
    (c) => videoController.getVideoSignedUrls(c)
  );

  return app;
};
