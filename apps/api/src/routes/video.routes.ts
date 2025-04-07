import { Hono } from "hono";
import { VideoController } from "../controllers/video.controller";
import {
  CreateVideoSchema,
  GetVideoSignedUrlsSchema,
  CreateStoryboardSchema,
} from "../schemas/video.schema";
import { zodValidator } from "../utils/zodValidator";

export const createVideoRoutes = (
  app: Hono,
  videoController: VideoController
) => {
  // Create a storyboard
  app.post("/api/storyboards", zodValidator("json", CreateStoryboardSchema), (c) =>
    videoController.createStoryboard(c)
  );

  // Create a new video
  app.post("/api/videos", zodValidator("json", CreateVideoSchema), (c) =>
    videoController.createVideo(c)
  );

  // Get signed URLs for a video and its scenes
  app.get(
    "/api/videos/:videoId/signed-urls",
    zodValidator("param", GetVideoSignedUrlsSchema),
    (c) => videoController.getVideoSignedUrls(c)
  );

  return app;
};
