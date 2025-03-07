import * as fs from "fs";
import * as path from "path";
import axios from "axios";
import { OpenAI } from "openai";

export class MusicService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Get background music using Beatoven.ai or fallback to silent audio
   * @param storyIdea - The original story idea/concept
   * @param jobId - Unique ID for this job
   * @param tempDir - Directory for temporary files
   * @param duration - Duration of the video in seconds
   * @returns Path to the downloaded music file
   */
  async getBackgroundMusic(
    storyIdea: string,
    jobId: string,
    tempDir: string,
    duration = 60
  ): Promise<string> {
    console.log(`Generating AI music for story: "${storyIdea}" (${duration}s)`);

    // Create job-specific directory for music
    const jobTempDir = path.join(tempDir, jobId);
    if (!fs.existsSync(jobTempDir)) {
      fs.mkdirSync(jobTempDir, { recursive: true });
    }

    try {
      // Try to generate music with Beatoven.ai
      return await this.getBeatovenMusic(storyIdea, jobTempDir, duration);
    } catch (error: any) {
      console.error(
        `❌ Error generating music with Beatoven.ai: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Generate a detailed music prompt for Beatoven.ai using AI
   * @param storyIdea - The original story idea/concept
   * @param duration - Duration in seconds
   * @returns Detailed prompt for Beatoven.ai
   */
  private async generateMusicPrompt(
    storyIdea: string,
    duration: number
  ): Promise<string> {
    try {
      // Format duration as minutes:seconds
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      const durationStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;

      const systemPrompt = `You are a music composer creating concise, effective prompts for Beatoven.ai based on story ideas.

Guidelines for Beatoven.ai prompts:
1. GENRE: Specify one clear genre (ambient, cinematic, lo-fi, electronic, rock, jazz, hip-hop)
2. INSTRUMENTS: List 2-3 specific instruments or sounds (piano, guitar, synth pads, strings)
3. MOOD: Define the emotional tone (happy, sad, tense, calm, uplifting, dark, nostalgic)
4. TEMPO: Specify tempo range (slow: 50-90 BPM, medium: 90-120 BPM, fast: 120-170 BPM)
5. USE CASE: Mention it's for "video background with narration"
6. Keep the entire prompt under 75 words
7. Make it loopable and suitable for voice narration overlay
8. DURATION: Include the provided duration, and make sure it is always the last thing in the prompt`;

      const userPrompt = `Create a concise music prompt for Beatoven.ai based on this story idea: "${storyIdea}". The music should be ${durationStr} in duration and will be used as background music for a video with voice narration.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 120,
      });

      const detailedPrompt = response.choices?.[0].message.content?.trim();

      if (!detailedPrompt) {
        throw new Error("Failed to generate music prompt");
      }

      console.log(`Generated music prompt: "${detailedPrompt}"`);
      return detailedPrompt;
    } catch (error: any) {
      console.warn(
        `Warning: Could not generate detailed music prompt: ${error.message}`
      );

      // Fallback to a simpler prompt if AI fails
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      const durationStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;

      return `${durationStr} ambient background music with soft piano and light strings. Calm mood, slow tempo. Loopable.`;
    }
  }

  /**
   * Get AI-generated music from Beatoven.ai based on story idea
   * @param storyIdea - The original story idea/concept
   * @param jobTempDir - Directory for temporary files
   * @param duration - Duration in seconds
   * @returns Path to the downloaded music file
   */
  private async getBeatovenMusic(
    storyIdea: string,
    jobTempDir: string,
    duration = 60
  ): Promise<string> {
    // Make sure we have an API key
    const beatovenApiKey = process.env.BEATOVEN_API_KEY;
    if (!beatovenApiKey) {
      throw new Error("BEATOVEN_API_KEY environment variable is required");
    }

    const baseUrl = "https://public-api.beatoven.ai";
    const outputPath = path.join(jobTempDir, `background_music.mp3`);

    try {
      // Generate a detailed prompt for Beatoven.ai
      const musicPrompt = await this.generateMusicPrompt(storyIdea, duration);
      console.log(
        `Requesting music from Beatoven.ai with prompt: "${musicPrompt}"`
      );

      // Step 1: Create a new track
      const createTrackResponse = await axios.post(
        `${baseUrl}/api/v1/tracks`,
        {
          prompt: {
            text: musicPrompt,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${beatovenApiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (
        !createTrackResponse.data.tracks ||
        createTrackResponse.data.tracks.length === 0
      ) {
        throw new Error("Failed to create track with Beatoven.ai");
      }

      const trackId = createTrackResponse.data.tracks[0];
      console.log(`Created Beatoven.ai track with ID: ${trackId}`);

      // Step 2: Compose the track
      const composeResponse = await axios.post(
        `${baseUrl}/api/v1/tracks/compose/${trackId}`,
        {
          format: "mp3",
          looping: true,
        },
        {
          headers: {
            Authorization: `Bearer ${beatovenApiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!composeResponse.data.task_id) {
        throw new Error("Failed to start composition task with Beatoven.ai");
      }

      const taskId = composeResponse.data.task_id;
      console.log(`Started Beatoven.ai composition task with ID: ${taskId}`);

      // Step 3: Poll for composition status
      let isComposed = false;
      let trackUrl = null;
      let attempts = 0;
      const maxAttempts = 60; // Maximum number of polling attempts (10 minutes with 10-second intervals)

      while (!isComposed && attempts < maxAttempts) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds between polls

        const statusResponse = await axios.get(
          `${baseUrl}/api/v1/tasks/${taskId}`,
          {
            headers: {
              Authorization: `Bearer ${beatovenApiKey}`,
            },
          }
        );

        console.log(
          `Beatoven.ai composition status: ${statusResponse.data.status} (attempt ${attempts}/${maxAttempts})`
        );

        if (statusResponse.data.status === "composed") {
          isComposed = true;
          trackUrl = statusResponse.data.meta.track_url;
        } else if (statusResponse.data.status === "failed") {
          throw new Error("Beatoven.ai composition failed");
        }
      }

      if (!isComposed || !trackUrl) {
        throw new Error(
          "Beatoven.ai composition timed out or failed to provide a track URL"
        );
      }

      // Step 4: Download the composed track
      console.log(`Downloading Beatoven.ai track from: ${trackUrl}`);
      const downloadResponse = await axios({
        method: "GET",
        url: trackUrl,
        responseType: "stream",
      });

      // Save the audio stream to a file
      const writer = fs.createWriteStream(outputPath);

      return new Promise((resolve, reject) => {
        writer.on("finish", () => {
          console.log(`✅ Downloaded Beatoven.ai music to ${outputPath}`);
          resolve(outputPath);
        });

        writer.on("error", (err) => {
          reject(
            new Error(`Failed to write Beatoven.ai music file: ${err.message}`)
          );
        });

        downloadResponse.data.pipe(writer);
      });
    } catch (error: any) {
      console.error(
        `❌ Error generating music with Beatoven.ai: ${error.message}`
      );
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      throw error;
    }
  }
}
