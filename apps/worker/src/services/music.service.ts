import * as fs from "fs";
import * as path from "path";
import { OpenAI } from "openai";
import { fal } from "@fal-ai/client";
import { Readable } from "stream";

// Define available music providers
export type MusicProvider = "beatoven" | "fal";

export class MusicService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Configure fal.ai client if API key is provided
    if (process.env.FAL_API_KEY) {
      fal.config({
        credentials: process.env.FAL_API_KEY,
      });
      console.log("Fal.ai client configured for MusicService.");
    }
  }

  /**
   * Get background music using the specified provider or fallback to silent audio
   * @param storyIdea - The original story idea/concept
   * @param jobId - Unique ID for this job
   * @param tempDir - Directory for temporary files
   * @param duration - Duration of the video in seconds
   * @param provider - The music provider to use ('beatoven' or 'fal')
   * @returns Path to the downloaded music file
   */
  async getBackgroundMusic(
    storyIdea: string,
    jobId: string,
    tempDir: string,
    duration = 60,
    provider: MusicProvider = "fal" // Default to fal
  ): Promise<string> {
    console.log(
      `Generating AI music via ${provider} for story: "${storyIdea}" (${duration}s)`
    );

    // Create job-specific directory for music
    const jobTempDir = path.join(tempDir, jobId);
    if (!fs.existsSync(jobTempDir)) {
      fs.mkdirSync(jobTempDir, { recursive: true });
    }

    try {
      if (provider === "fal") {
        // Ensure Fal.ai API key is available
        if (!process.env.FAL_API_KEY) {
          throw new Error(
            "FAL_API_KEY environment variable is required to use the 'fal' provider"
          );
        }
        return await this.getFalMusic(storyIdea, jobTempDir, duration);
      } else if (provider === "beatoven") {
        return await this.getBeatovenMusic(storyIdea, jobTempDir, duration);
      } else {
        throw new Error(`Unsupported music provider: ${provider}`);
      }
    } catch (error: any) {
      console.error(
        `❌ Error generating music with ${provider}: ${error.message}`
      );
      throw error; // Re-throw for now
    }
  }

  /**
   * Generate a music prompt suitable for AI music generation.
   * @param storyIdea - The original story idea/concept
   * @returns Simple prompt string
   * @throws Error if prompt generation fails
   */
  private async generateMusicPrompt(storyIdea: string): Promise<string> {
    try {
      const systemPrompt = `Create a music prompt for an AI generator based on the story idea.

Guidelines:
1. Describe the desired mood, genre, tempo, and key instruments.
2. Keep it concise, ideally under 150 characters.
3. Examples: "Uplifting cinematic orchestra, adventurous theme, fast tempo.", "Relaxing lofi hip-hop beat, mellow piano, rainy day vibe.", "Dark electronic synthwave, 80s retro feel, driving bassline, 120 BPM."`;

      const userPrompt = `Create a music prompt for this story: "${storyIdea}"`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 80,
      });

      const stylePrompt = response.choices?.[0].message.content?.trim();

      if (!stylePrompt) {
        throw new Error("Failed to generate music prompt via OpenAI");
      }

      console.log(`Generated music prompt: "${stylePrompt}"`);
      return stylePrompt;
    } catch (error: any) {
      console.error(`Error generating music prompt: ${error.message}`);
      throw new Error(`Failed to generate music prompt: ${error.message}`);
    }
  }

  /**
   * Get AI-generated music from Fal.ai based on story idea
   * @param storyIdea - The original story idea/concept
   * @param jobTempDir - Directory for temporary files
   * @param duration - Duration in seconds
   * @returns Path to the downloaded music file (WAV)
   */
  private async getFalMusic(
    storyIdea: string,
    jobTempDir: string,
    duration: number
  ): Promise<string> {
    const modelId = "CassetteAI/music-generator";
    const outputPath = path.join(jobTempDir, `background_music_fal.wav`);

    try {
      const musicPrompt = await this.generateMusicPrompt(storyIdea);
      console.log(
        `Requesting music from Fal.ai (${modelId}) with prompt: "${musicPrompt}", duration: ${duration}s`
      );

      const { request_id } = await fal.queue.submit(modelId, {
        input: {
          prompt: musicPrompt,
          duration: duration,
        },
      });

      if (!request_id) {
        throw new Error("Failed to submit music generation request to Fal.ai");
      }
      console.log(
        `Started Fal.ai music generation task with ID: ${request_id}`
      );

      // Step 2: Poll for completion status
      let resultUrl: string | null = null;
      let attempts = 0;
      const maxAttempts = 60;
      const pollInterval = 10000;

      while (attempts < maxAttempts) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, pollInterval));

        const statusResponse = await fal.queue.status(modelId, {
          requestId: request_id,
          logs: false,
        });

        // Log only IN_PROGRESS or IN_QUEUE, otherwise it's likely COMPLETED (or timed out)
        if (
          statusResponse.status === "IN_PROGRESS" ||
          statusResponse.status === "IN_QUEUE"
        ) {
          console.log(
            `Fal.ai music status: ${statusResponse.status} (attempt ${attempts}/${maxAttempts})`
          );
        } else if (statusResponse.status === "COMPLETED") {
          console.log(
            `Fal.ai music status: COMPLETED (attempt ${attempts}/${maxAttempts}). Fetching result...`
          );
          // Fetch the final result containing the URL
          const resultResponse = await fal.queue.result(modelId, {
            requestId: request_id,
          });
          if (resultResponse.data?.audio_file?.url) {
            resultUrl = resultResponse.data.audio_file.url;
            break; // Exit polling loop
          } else {
            // Even if status is COMPLETED, the result might be missing the URL
            console.error(
              "Fal.ai 'COMPLETED' result missing audio_file.url:",
              resultResponse
            );
            throw new Error(
              "Fal.ai task completed but did not return a valid URL in the expected format (data.audio_file.url)."
            );
          }
        } else {
          // Handle unexpected status values if necessary, or just log them
          console.warn(
            `Fal.ai music status: Received unexpected status (attempt ${attempts}/${maxAttempts})`
          );
          // You might still want to try fetching the result just in case,
          // or treat this as an error depending on observed behavior.
          // For now, we'll continue polling until maxAttempts.
        }
      } // End while loop

      // Check if we exited the loop because of completion or timeout
      if (!resultUrl) {
        // If resultUrl is still null, it means we hit maxAttempts without COMPLETED status
        // or the COMPLETED status didn't yield a valid URL.
        console.error(
          `Fal.ai music generation timed out after ${maxAttempts} attempts or failed to retrieve URL.`
        );
        // You could try one last time to fetch the result here in case of race conditions
        try {
          const finalResult = await fal.queue.result(modelId, {
            requestId: request_id,
          });
          if (finalResult.data?.audio_file?.url) {
            console.log("Successfully fetched result URL after timeout check.");
            resultUrl = finalResult.data.audio_file.url;
          } else {
            throw new Error(
              "Fal.ai music generation timed out or result was invalid."
            );
          }
        } catch (finalResultError: any) {
          console.error(
            `Error fetching final result for ${request_id}: ${finalResultError.message}`
          );
          throw new Error("Fal.ai music generation timed out or failed.");
        }
      }

      // At this point, if resultUrl was null, an error would have been thrown.
      // So, resultUrl must be a string here.
      if (!resultUrl) {
        // This should be theoretically unreachable due to the logic above, but acts as a safeguard.
        throw new Error(
          "Internal error: resultUrl is unexpectedly null after checks."
        );
      }

      // Step 3: Download the generated music file (WAV)
      console.log(`Downloading Fal.ai music from: ${resultUrl}`);
      await this.downloadFile(resultUrl, outputPath);

      return outputPath;
    } catch (error: any) {
      console.error(`❌ Error generating music with Fal.ai: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get AI-generated music from Beatoven.ai based on story idea using fetch
   * @param storyIdea - The original story idea/concept
   * @param jobTempDir - Directory for temporary files
   * @param duration - Duration in seconds
   * @returns Path to the downloaded music file (MP3)
   */
  private async getBeatovenMusic(
    storyIdea: string,
    jobTempDir: string,
    duration = 60
  ): Promise<string> {
    const beatovenApiKey = process.env.BEATOVEN_API_KEY;
    if (!beatovenApiKey) {
      throw new Error(
        "BEATOVEN_API_KEY environment variable is required for Beatoven provider"
      );
    }

    const baseUrl = "https://public-api.beatoven.ai";
    const outputPath = path.join(jobTempDir, `background_music_beatoven.mp3`);

    try {
      const descriptivePrompt = await this.generateMusicPrompt(storyIdea);
      const beatovenPrompt = `${duration} seconds ${descriptivePrompt}`;
      console.log(
        `Requesting music from Beatoven.ai with prompt: "${beatovenPrompt}"`
      );

      // Step 1: Compose the track using fetch
      const composeUrl = `${baseUrl}/api/v1/tracks/compose`;
      const composeBody = JSON.stringify({
        prompt: { text: beatovenPrompt },
        format: "mp3",
        looping: true,
      });

      const composeResponse = await fetch(composeUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${beatovenApiKey}`,
          "Content-Type": "application/json",
        },
        body: composeBody,
        // Note: fetch doesn't have a built-in timeout like axios in Node < 18
        // Use AbortController for timeouts if needed, especially for longer operations
      });

      if (!composeResponse.ok) {
        const errorBody = await composeResponse.text();
        console.error("Beatoven Compose Error:", errorBody);
        throw new Error(
          `Failed to start composition task with Beatoven.ai. Status: ${composeResponse.status}`
        );
      }

      const composeResult = await composeResponse.json();

      if (!composeResult.task_id) {
        console.error(
          "Beatoven Compose Response Missing task_id:",
          composeResult
        );
        throw new Error("Beatoven.ai compose response missing task_id");
      }

      const taskId = composeResult.task_id;
      console.log(`Started Beatoven.ai composition task with ID: ${taskId}`);

      // Step 2: Poll for composition status using fetch
      let isComposed = false;
      let trackUrl: string | null = null;
      let attempts = 0;
      const maxAttempts = 60;
      const pollInterval = 10000; // 10 seconds

      while (!isComposed && attempts < maxAttempts) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, pollInterval));

        const statusUrl = `${baseUrl}/api/v1/tasks/${taskId}`;
        try {
          const statusFetchResponse = await fetch(statusUrl, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${beatovenApiKey}`,
            },
          });

          if (!statusFetchResponse.ok) {
            // Don't throw immediately on non-ok status during polling, log it
            console.warn(
              `Beatoven polling status check failed (attempt ${attempts}): ${statusFetchResponse.status}`
            );
            // Optionally check specific status codes (e.g., 404 might mean task expired/invalid)
            continue; // Try again next interval
          }

          const statusData = await statusFetchResponse.json();

          console.log(
            `Beatoven.ai composition status: ${statusData.status} (attempt ${attempts}/${maxAttempts})`
          );

          if (statusData.status === "composed") {
            isComposed = true;
            if (statusData.meta?.track_url) {
              trackUrl = statusData.meta.track_url;
            } else {
              console.error(
                "Beatoven 'composed' status missing meta.track_url",
                statusData
              );
              throw new Error(
                "Beatoven.ai composition completed but track URL is missing."
              );
            }
          } else if (statusData.status === "failed") {
            console.error("Beatoven task failed. Response:", statusData);
            throw new Error(
              `Beatoven.ai composition failed. Reason: ${
                statusData.failure_reason || "Unknown"
              }`
            );
          }
        } catch (pollError: any) {
          console.error(
            `Error polling Beatoven status (attempt ${attempts}): ${pollError.message}`
          );
          // Continue polling unless max attempts reached
          if (attempts >= maxAttempts) {
            throw new Error(
              `Beatoven polling failed after ${maxAttempts} attempts.`
            );
          }
        }
      }

      if (!isComposed || !trackUrl) {
        throw new Error(
          "Beatoven.ai composition timed out or failed to provide a track URL"
        );
      }

      // Step 3: Download the composed track using fetch
      console.log(`Downloading Beatoven.ai track from: ${trackUrl}`);
      await this.downloadFile(trackUrl, outputPath); // Use renamed helper

      return outputPath;
    } catch (error: any) {
      console.error(
        `❌ Error generating music with Beatoven.ai: ${error.message}`
      );
      // No specific axios error check needed now
      throw error;
    }
  }

  /**
   * Downloads a file from a URL to a specified path using fetch.
   * Renamed from downloadAudio to reflect general purpose.
   * @param url - The URL of the file to download.
   * @param outputPath - The local path to save the downloaded file.
   */
  private async downloadFile(url: string, outputPath: string): Promise<void> {
    // Renamed method
    try {
      console.log(`Attempting to download file from ${url} to ${outputPath}`); // Updated log
      const response = await fetch(url, { method: "GET" });

      if (!response.ok) {
        throw new Error(
          `Failed to download file. Status: ${response.status} ${response.statusText}` // Updated log
        );
      }

      // Ensure the response body is available and is a Readable stream
      if (!response.body) {
        throw new Error("Download response body is null.");
      }

      // Convert Node.js fetch's ReadableStream to Node.js stream.Readable
      const bodyStream = Readable.fromWeb(response.body as any); // Cast needed

      const writer = fs.createWriteStream(outputPath);

      // Pipe the stream and handle events
      bodyStream.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on("finish", () => {
          console.log(`✅ Downloaded file to ${outputPath}`); // Updated log
          resolve();
        });
        writer.on("error", (err) => {
          console.error(`Failed to write file: ${err.message}`); // Updated log
          // Attempt to clean up partially written file
          if (fs.existsSync(outputPath)) {
            try {
              fs.unlinkSync(outputPath);
            } catch (unlinkErr: any) {
              console.error(
                `Error cleaning up partial file ${outputPath}: ${unlinkErr.message}`
              );
            }
          }
          reject(new Error(`Failed to write file: ${err.message}`)); // Updated log
        });
        bodyStream.on("error", (err: Error) => {
          // Also handle errors on the source stream
          console.error(`Error during download stream: ${err.message}`);
          writer.close(); // Ensure writer is closed on stream error
          reject(new Error(`Failed to download file stream: ${err.message}`)); // Updated log
        });
      });
    } catch (error: any) {
      console.error(
        `❌ Failed to download file from ${url}: ${error.message}` // Updated log
      );
      throw new Error(`Failed to download file: ${error.message}`); // Updated log
    }
  }
}
