import { Hono } from "hono";
import { VideoController } from "../controllers/video.controller";
import {
  CreateStoryboardSchema,
  GetVideoSignedUrlsSchema,
  UpdateVideoDetailsSchema,
  StartVideoJobSchema,
} from "../schemas/video.schema";
import { zodValidator } from "../utils/zodValidator";

export const createVideoRoutes = (
  app: Hono,
  videoController: VideoController
) => {
  // Create a new video with storyboard
  app.post("/api/videos", zodValidator("json", CreateStoryboardSchema), (c) =>
    videoController.createVideo(c)
  );

  // Update video details
  app.put(
    "/api/videos/:videoId",
    zodValidator("json", UpdateVideoDetailsSchema),
    (c) => videoController.updateVideoDetails(c)
  );

  // Start video creation job
  app.post(
    "/api/videos/:videoId/create",
    zodValidator("param", StartVideoJobSchema),
    (c) => videoController.startVideoJob(c)
  );

  // Get signed URLs for a video and its scenes
  app.get(
    "/api/videos/:videoId/signed-urls",
    zodValidator("param", GetVideoSignedUrlsSchema),
    (c) => videoController.getVideoSignedUrls(c)
  );

  return app;
};
