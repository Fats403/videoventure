import { Context } from "hono";
import { VoiceService } from "../services/voice.service";
import { getAuth } from "@hono/clerk-auth";

export class VoiceController {
  private voiceService: VoiceService;

  constructor(voiceService: VoiceService) {
    this.voiceService = voiceService;
  }

  /**
   * Get available ElevenLabs voices
   */
  async getVoices(c: Context): Promise<Response> {
    try {
      const auth = getAuth(c);
      const userId = auth?.userId;

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Get page size from query param or use default
      const pageSize = c.req.query("page_size")
        ? parseInt(c.req.query("page_size") || "20", 10)
        : 20;

      const voices = await this.voiceService.getVoices(pageSize);
      return c.json(voices);
    } catch (error) {
      console.error("Error getting voices:", error);
      return c.json({ error: "Failed to get voices" }, 500);
    }
  }
}
