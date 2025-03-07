import * as fs from "fs";
import * as path from "path";
import { ElevenLabsClient } from "elevenlabs";
import ffmpeg from "fluent-ffmpeg";
import { Scene } from "./storyboard.service";

export class AudioService {
  private elevenlabs: ElevenLabsClient;

  constructor() {
    this.elevenlabs = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY,
    });
  }

  /**
   * Generate voice over audio for a scene
   * @param scene - Scene object with voiceover text
   * @param jobId - Unique ID for this job
   * @param tempDir - Directory for temporary files
   * @param voiceId - ElevenLabs voice ID to use
   * @returns Path to the generated audio file
   */
  async generateVoiceOver(
    scene: Scene,
    jobId: string,
    tempDir: string,
    voiceId = "JBFqnCBsd6RMkjVDRZzb"
  ): Promise<string> {
    const sceneNumber = scene.scene_number;
    const voiceoverText = scene.voiceover;

    console.log(`Generating voice over for Scene ${sceneNumber}...`);

    try {
      // Create job-specific directory for audio
      const jobTempDir = path.join(tempDir, jobId);
      if (!fs.existsSync(jobTempDir)) {
        fs.mkdirSync(jobTempDir, { recursive: true });
      }

      const rawAudioPath = path.join(
        jobTempDir,
        `scene_${sceneNumber}_raw_audio.mp3`
      );
      const outputPath = path.join(
        jobTempDir,
        `scene_${sceneNumber}_audio.mp3`
      );

      // Generate audio using ElevenLabs
      const audioStream = await this.elevenlabs.textToSpeech.convert(voiceId, {
        text: voiceoverText,
        output_format: "mp3_44100_128",
        model_id: "eleven_flash_v2_5",
      });

      // Save the raw audio stream to a file
      const writer = fs.createWriteStream(rawAudioPath);

      await new Promise<void>((resolve, reject) => {
        writer.on("finish", () => resolve());
        writer.on("error", (err) => reject(err));
        audioStream.pipe(writer);
      });

      console.log(`✅ Generated raw voice over for Scene ${sceneNumber}`);

      // Process the audio (normalize, add silence at end)
      await this.processAudio(rawAudioPath, outputPath);

      return outputPath;
    } catch (error: any) {
      console.error(
        `❌ Error generating voice over for Scene ${sceneNumber}:`,
        error.message
      );
      throw error;
    }
  }

  /**
   * Process audio file (normalize volume, add silence at end)
   * @param inputPath - Path to input audio file
   * @param outputPath - Path to save processed audio
   * @returns Path to processed audio file
   */
  private async processAudio(
    inputPath: string,
    outputPath: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(inputPath)
        .audioFilters([
          // Add 1 second delay at the beginning
          "adelay=1000|1000",
          // Add 1 second of silence at the end
          "apad=pad_dur=1.0",
        ])
        .output(outputPath)
        .on("end", () => {
          fs.unlinkSync(inputPath);
          resolve(outputPath);
        })
        .on("error", (err) => {
          reject(
            new Error(`Failed to add silence to audio file: ${err.message}`)
          );
        })
        .run();
    });
  }

  /**
   * Get the duration of an audio file in seconds
   * @param audioPath - Path to audio file
   * @returns Duration in seconds
   */
  async getAudioDuration(audioPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(audioPath, (err, metadata) => {
        if (err) {
          console.error(`Error getting audio duration: ${err.message}`);
          reject(err);
          return;
        }

        const duration = metadata.format.duration || 0;
        resolve(duration);
      });
    });
  }
}
