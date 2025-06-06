import { ElevenLabsClient } from "elevenlabs";

export class VoiceService {
  private client: ElevenLabsClient;

  constructor() {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error("ELEVENLABS_API_KEY environment variable is required");
    }
    this.client = new ElevenLabsClient({ apiKey });
  }

  /**
   * Get available ElevenLabs voices
   * @param pageSize Number of voices to fetch
   * @returns List of voices with id, name and preview URL
   */
  async getVoices(pageSize = 20) {
    try {
      const response = await this.client.voices.search({
        include_total_count: true,
        page_size: pageSize,
      });

      // Filter out voices without names and map to our expected format
      const voices = response.voices
        .filter((voice) => voice.name && voice.voice_id) // Only include voices with valid name and id
        .map((voice) => ({
          voice_id: voice.voice_id,
          name: voice.name!,
          preview_url: voice.preview_url || undefined,
        }));

      return {
        voices,
        total_count: response.total_count || voices.length,
      };
    } catch (error) {
      console.error("Error fetching ElevenLabs voices:", error);
      throw error;
    }
  }
}
