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
   * Generate a simplified music prompt for Beatoven.ai with consistent duration format
   * @param storyIdea - The original story idea/concept
   * @param duration - Duration in seconds
   * @returns Simple prompt for Beatoven.ai with consistent duration format
   * @throws Error if prompt generation fails
   */
  private async generateMusicPrompt(
    storyIdea: string,
    duration: number
  ): Promise<string> {
    try {
      const systemPrompt = `Create a very simple, short music prompt for Beatoven.ai based on the story idea.
      
Guidelines:
1. Keep it under 80 characters total
2. Use simple words and basic music genres (lo-fi, ambient, cinematic, etc.)
3. Focus on just 1-2 key aspects (mood, genre, or instrument)
4. Example format: "peaceful lo-fi with piano" or "upbeat electronic music"`;

      const userPrompt = `Create a simple music prompt for this story: "${storyIdea}"`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 50, // Limiting token count to ensure short responses
      });

      let stylePrompt = response.choices?.[0].message.content?.trim();

      if (!stylePrompt) {
        throw new Error("Failed to generate music prompt");
      }

      // Remove any duration format that might have been included
      stylePrompt = stylePrompt.replace(/\d+:\d+\s+/, "");
      stylePrompt = stylePrompt.replace(/\d+\s+seconds?\s+/, "");

      // Format the final prompt with duration at the beginning
      const finalPrompt = `${duration} seconds ${stylePrompt}`;

      console.log(`Generated music prompt: "${finalPrompt}"`);
      return finalPrompt;
    } catch (error: any) {
      console.error(`Error generating music prompt: ${error.message}`);
      throw new Error(`Failed to generate music prompt: ${error.message}`);
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

      // Step 1: Compose the track directly with the prompt
      const composeResponse = await axios.post(
        `${baseUrl}/api/v1/tracks/compose`,
        {
          prompt: {
            text: musicPrompt,
          },
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

      // Step 2: Poll for composition status
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

      // Step 3: Download the composed track
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
