import { Hono } from "hono";
import { VideoController } from "../controllers/video.controller";
import { validate } from "../middleware/validate";
import { CreateVideoSchema, JobParamSchema } from "../schemas/video.schema";

export const createVideoRoutes = (
  app: Hono<{ Variables: { userId: string } }>,
  videoController: VideoController
) => {
  // Create a new video
  app.post("/api/videos", validate(CreateVideoSchema, "json"), (c) =>
    videoController.createVideo(c)
  );

  // Get job status
  app.get("/api/jobs/:jobId", validate(JobParamSchema), (c) =>
    videoController.getJobStatus(c)
  );

  return app;
};
