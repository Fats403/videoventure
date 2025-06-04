import * as fs from "fs";
import * as path from "path";
import { ElevenLabsClient } from "elevenlabs";
import ffmpeg from "fluent-ffmpeg";
import { Scene } from "@video-venture/shared";

// Define interface for word-level timestamps
export interface WordTimestamp {
  word: string;
  start: number; // in seconds
  end: number; // in seconds
}

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
    const sceneNumber = scene.order;
    const voiceoverText = scene.voiceOver;

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
      const audioResponse =
        await this.elevenlabs.textToSpeech.convertWithTimestamps(voiceId, {
          text: voiceoverText,
          output_format: "mp3_44100_128",
          model_id: "eleven_flash_v2_5",
        });

      // Save the audio to a file
      fs.writeFileSync(
        rawAudioPath,
        Buffer.from(audioResponse.audio_base64, "base64")
      );

      console.log(`✅ Generated raw voice over for Scene ${sceneNumber}`);

      // Process the audio (normalize, add silence at beginning and end)
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
   * Generate voice over audio with word-level timestamps
   * @returns Object with audioPath and word timestamps
   */
  async generateVoiceOverWithTimestamps(
    scene: Scene,
    jobId: string,
    tempDir: string,
    voiceId = "JBFqnCBsd6RMkjVDRZzb"
  ): Promise<{ audioPath: string; wordTimestamps: WordTimestamp[] }> {
    const sceneNumber = scene.order;
    const voiceoverText = scene.voiceOver;

    console.log(
      `Generating voice over with timestamps for Scene ${sceneNumber}...`
    );

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
      const timestampsPath = path.join(
        jobTempDir,
        `scene_${sceneNumber}_timestamps.json`
      );

      // Generate audio using ElevenLabs with timestamps
      const response = await this.elevenlabs.textToSpeech.convertWithTimestamps(
        voiceId,
        {
          text: voiceoverText,
          output_format: "mp3_44100_128",
          model_id: "eleven_flash_v2_5",
        }
      );

      // The response has audio_base64 and alignment data
      const audioBuffer = Buffer.from(response.audio_base64, "base64");

      // Write audio buffer to file
      fs.writeFileSync(rawAudioPath, audioBuffer);

      console.log(`✅ Generated raw voice over for Scene ${sceneNumber}`);

      // Generate word-level timestamps from character alignment
      // Use normalized_alignment if available, otherwise use alignment
      const alignmentData = response.normalized_alignment || response.alignment;
      const wordTimestamps = this.convertCharacterToWordTimestamps(
        voiceoverText,
        alignmentData
      );

      // Save the word timestamps for debugging
      fs.writeFileSync(timestampsPath, JSON.stringify(wordTimestamps, null, 2));

      // Process the audio (normalize, add silence at beginning and end)
      await this.processAudio(rawAudioPath, outputPath);

      return {
        audioPath: outputPath,
        wordTimestamps,
      };
    } catch (error: any) {
      console.error(
        `❌ Error generating voice over with timestamps for Scene ${sceneNumber}:`,
        error.message
      );
      throw error;
    }
  }

  /**
   * Convert character-level alignment to optimized word-level timestamps
   * with improved grouping for better subtitle readability
   */
  private convertCharacterToWordTimestamps(
    text: string,
    alignment: any
  ): WordTimestamp[] {
    if (!alignment || !alignment.characters) {
      console.warn("No character alignment data available");
      return [];
    }

    const {
      characters,
      character_start_times_seconds,
      character_end_times_seconds,
    } = alignment;

    // First pass: Basic word extraction
    const basicWords: WordTimestamp[] = [];

    let currentWord = "";
    let wordStart = 0;
    let wordEnd = 0;
    let isFirstCharInWord = true;

    for (let i = 0; i < characters.length; i++) {
      const char = characters[i];
      const nextChar = i < characters.length - 1 ? characters[i + 1] : null;
      const startTime = character_start_times_seconds[i];
      const endTime = character_end_times_seconds[i];

      // Track word boundary start
      if (isFirstCharInWord) {
        wordStart = startTime;
        isFirstCharInWord = false;
      }

      // Append character to current word
      currentWord += char;
      wordEnd = endTime;

      // Check if this is the end of a word (space, punctuation, or end of text)
      const isEndOfWord =
        nextChar === null || // End of text
        nextChar === " " || // Space
        /[.,;!?]/.test(nextChar); // Punctuation

      if (isEndOfWord) {
        // Add completed word if not empty
        if (currentWord.trim()) {
          basicWords.push({
            word: currentWord.trim().toUpperCase(),
            start: wordStart,
            end: wordEnd,
          });
        }

        // Reset for next word
        currentWord = "";
        isFirstCharInWord = true;
      }
    }

    // Second pass: Optimize for subtitle display with intelligent grouping
    return this.optimizeWordsForSubtitles(basicWords);
  }

  /**
   * Optimize word timestamps for better subtitle display
   * - Groups short words with next word
   * - Removes standalone punctuation
   * - Preserves audio synchronization
   */
  private optimizeWordsForSubtitles(words: WordTimestamp[]): WordTimestamp[] {
    if (!words.length) return [];

    // Filter out standalone punctuation
    const filteredWords = words.filter((word) => {
      const wordText = word.word.trim();
      // Skip if it's just punctuation
      return !/^[.,;!?]+$/.test(wordText);
    });

    const optimized: WordTimestamp[] = [];
    const SHORT_WORDS = [
      "A",
      "I",
      "AN",
      "TO",
      "IN",
      "IS",
      "IT",
      "OF",
      "ON",
      "OR",
      "BE",
      "AS",
      "AT",
      "BY",
      "MY",
      "WE",
      "HE",
      "SHE",
    ];

    // Process words to combine short words with next word
    for (let i = 0; i < filteredWords.length; i++) {
      const current = { ...filteredWords[i] };

      // Check if this is one of our designated short words
      const isShortWord = SHORT_WORDS.includes(current.word);

      // If it's a short word and not the last word, combine with next word
      if (isShortWord && i < filteredWords.length - 1) {
        const next = filteredWords[i + 1];

        // Create combined word - keeping exact start/end times to preserve sync
        optimized.push({
          word: `${current.word} ${next.word}`,
          start: current.start, // Keep original start time
          end: next.end, // End time from the second word
        });

        // Skip the next word since we've combined it
        i++;
      }
      // If it's the last word or not a designated short word
      else {
        optimized.push(current);
      }
    }

    console.log(`Optimized words: ${words.length} → ${optimized.length}`);
    return optimized;
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
