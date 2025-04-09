import { Hono } from "hono";
import { VoiceController } from "../controllers/voice.controller";

export const createVoiceRoutes = (
  app: Hono,
  voiceController: VoiceController
) => {
  // Get available voices
  app.get("/api/voices", (c) => voiceController.getVoices(c));

  return app;
};
