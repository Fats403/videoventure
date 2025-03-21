import * as fs from "fs";
import * as path from "path";
import ffmpeg from "fluent-ffmpeg";
import { WordTimestamp } from "./audio.service";

/**
 * Clean subtitle service with professional text outline and custom font support
 */
export class SubtitleService {
  // Silence padding that's added in the AudioService.processAudio method
  private BEGINNING_SILENCE_PADDING = 1.0; // seconds

  /**
   * Find the appropriate font file path
   * Checks custom path, project fonts directory, and falls back to system font
   */
  private getFontPath(customFontPath?: string): string {
    // Default system fonts as fallbacks based on OS
    let defaultFontPath = "/System/Library/Fonts/Helvetica.ttc"; // macOS

    // Check for Windows system fonts
    if (process.platform === "win32") {
      const windowsFonts = [
        "C:\\Windows\\Fonts\\arial.ttf",
        "C:\\Windows\\Fonts\\segoeui.ttf",
      ];

      for (const font of windowsFonts) {
        if (fs.existsSync(font)) {
          defaultFontPath = font;
          break;
        }
      }
    }
    // Check for Linux system fonts
    else if (process.platform === "linux") {
      const linuxFonts = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
      ];

      for (const font of linuxFonts) {
        if (fs.existsSync(font)) {
          defaultFontPath = font;
          break;
        }
      }
    }

    // Check if custom font path exists
    if (customFontPath && fs.existsSync(customFontPath)) {
      return customFontPath;
    }

    const defaultFontFile = "concert-one.ttf";

    // Check in project font directory (multiple possible locations)
    const projectFontPaths = [
      path.join(__dirname, `../fonts/${defaultFontFile}`), // src/fonts
      path.join(__dirname, `../../fonts/${defaultFontFile}`), // apps/worker/fonts
      path.join(process.cwd(), `fonts/${defaultFontFile}`), // Current working directory
    ];

    for (const fontPath of projectFontPaths) {
      if (fs.existsSync(fontPath)) {
        return fontPath;
      }
    }

    return defaultFontPath;
  }

  /**
   * Add clean outlined subtitles directly to video
   * Word-by-word display with safe FFmpeg usage
   */
  async addSubtitlesToVideo(
    videoPath: string,
    wordTimestamps: WordTimestamp[],
    outputPath: string,
    options: {
      fontSize?: number;
      textColor?: string;
      outlineColor?: string;
      outlineThickness?: "normal" | "thick" | "extra-thick";
      customFontPath?: string;
      position?: "bottom" | "middle" | "top";
    } = {},
    startOffset: number = 0
  ): Promise<string> {
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Input video not found at ${videoPath}`);
    }

    // Set default styling options
    const style = {
      fontSize: options.fontSize || 72,
      textColor: options.textColor || "white",
      outlineColor: options.outlineColor || "black",
      outlineThickness: options.outlineThickness || "normal",
      fontPath: this.getFontPath(options.customFontPath),
      position: options.position || "middle",
    };

    console.log(`Using font: ${style.fontPath}`);

    // Build position setting based on chosen position
    let yPosition = "(h-text_h)/2"; // Default middle
    if (style.position === "bottom") {
      yPosition = "h-text_h-100"; // 100 pixels from bottom
    } else if (style.position === "top") {
      yPosition = "100"; // 100 pixels from top
    }

    // Determine outline thickness
    let borderWidth = 3; // normal
    if (style.outlineThickness === "thick") {
      borderWidth = 5;
    } else if (style.outlineThickness === "extra-thick") {
      borderWidth = 8;
    }

    // Handle empty word timestamps case
    if (!wordTimestamps.length) {
      // Just copy the video without modifications
      return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .outputOptions(["-c copy"])
          .output(outputPath)
          .on("error", (err) => {
            console.error("FFmpeg error:", err.message);
            reject(err);
          })
          .on("end", () => {
            console.log("✅ Copied video (no subtitles needed)");
            resolve(outputPath);
          })
          .run();
      });
    }

    // Process all words at once - no batching
    console.log(`Processing all ${wordTimestamps.length} words at once`);
    return this.addSubtitlesSimple(
      videoPath,
      wordTimestamps,
      outputPath,
      style,
      yPosition,
      borderWidth,
      startOffset
    );
  }

  /**
   * Simple method to add subtitles for a small number of words
   * This is a direct, reliable approach using FFmpeg
   */
  private async addSubtitlesSimple(
    videoPath: string,
    words: WordTimestamp[],
    outputPath: string,
    style: {
      fontSize: number;
      textColor: string;
      outlineColor: string;
      fontPath: string;
      position: string;
    },
    yPosition: string,
    borderWidth: number,
    startOffset: number
  ): Promise<string> {
    // Ensure the output directory exists with verification
    const outputDir = path.dirname(outputPath);
    await this.ensureDirectoryExistsWithVerification(outputDir);

    // Generate filter commands for each word
    const filterCommands = words.map((word) => {
      const adjustedStart =
        word.start + this.BEGINNING_SILENCE_PADDING + startOffset;
      const adjustedEnd =
        word.end + this.BEGINNING_SILENCE_PADDING + startOffset;

      // Sanitize the word completely to avoid any escaping issues
      // Remove any characters that might cause issues
      const safeWord = word.word.replace(/[^a-zA-Z0-9 ]/g, ""); // Keep only alphanumeric characters and spaces

      return (
        `drawtext=text='${safeWord}':fontcolor=${style.textColor}:fontsize=${style.fontSize}:` +
        `fontfile=${style.fontPath}:` +
        `x=(w-text_w)/2:y=${yPosition}:` +
        `enable='between(t,${adjustedStart},${adjustedEnd})':` +
        `borderw=${borderWidth}:bordercolor=${style.outlineColor}`
      );
    });

    // Join all filter commands with comma
    const filterString = filterCommands.join(",");

    // Write the filter to a file instead of passing directly
    const filterFile = path.join(
      outputDir,
      `subtitle-filter-${Date.now()}.txt`
    );
    fs.writeFileSync(filterFile, filterString);

    console.log(`Created filter file: ${filterFile}`);

    return new Promise((resolve, reject) => {
      // Use -filter_complex_script instead of inline -vf
      ffmpeg(videoPath)
        .outputOptions([
          "-c:v libx264",
          "-c:a copy",
          "-filter_complex_script",
          filterFile,
        ])
        .output(outputPath)
        .on("progress", (progress) => {
          if (progress.percent) {
            console.log(`Adding subtitles: ${Math.floor(progress.percent)}%`);
          }
        })
        .on("error", (err) => {
          console.error("FFmpeg error:", err.message);

          // For debugging - try to read the content of the filter file
          try {
            const filterContent = fs.readFileSync(filterFile, "utf8");
            console.log(
              `Filter file content (first 500 chars): ${filterContent.substring(
                0,
                500
              )}...`
            );
          } catch (readErr) {
            console.error("Error reading filter file:", readErr);
          }

          reject(err);
        })
        .on("end", () => {
          console.log(`✅ Added subtitles successfully`);

          // Clean up filter file
          try {
            fs.unlinkSync(filterFile);
          } catch (err) {
            console.warn(`Could not remove filter file: ${err}`);
          }

          resolve(outputPath);
        })
        .run();
    });
  }

  /**
   * Add subtitles to a combined video with multiple scenes
   */
  async addCombinedSubtitlesToVideo(
    videoPath: string,
    allScenes: {
      wordTimestamps: WordTimestamp[];
      startTime: number; // Position in the final video in seconds
    }[],
    outputPath: string,
    options: {
      fontSize?: number;
      textColor?: string;
      outlineColor?: string;
      outlineThickness?: "normal" | "thick" | "extra-thick";
      customFontPath?: string;
      position?: "bottom" | "middle" | "top";
    } = {}
  ): Promise<string> {
    // Flatten all word timestamps with their scene offset
    const allWords: WordTimestamp[] = [];

    allScenes.forEach((scene) => {
      scene.wordTimestamps.forEach((timestamp) => {
        allWords.push({
          word: timestamp.word,
          start: timestamp.start + scene.startTime,
          end: timestamp.end + scene.startTime,
        });
      });
    });

    // Sort by start time
    allWords.sort((a, b) => a.start - b.start);

    // Add subtitles to the combined video
    return this.addSubtitlesToVideo(videoPath, allWords, outputPath, options);
  }

  /**
   * Ensure that a directory exists, creating it if necessary
   */
  private ensureDirectoryExists(directoryPath: string): void {
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
      console.log(`Created directory: ${directoryPath}`);
    }
  }

  /**
   * Ensures a directory exists with verification and retries
   * @param directoryPath - Path to directory to create
   * @param maxRetries - Maximum number of retries
   * @param retryDelay - Milliseconds to wait between retries
   */
  private async ensureDirectoryExistsWithVerification(
    directoryPath: string,
    maxRetries = 5,
    retryDelay = 100
  ): Promise<void> {
    // First attempt
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }

    // Verify directory exists
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (fs.existsSync(directoryPath)) {
        // Extra verification - try to write a test file to confirm directory is usable
        const testFilePath = path.join(
          directoryPath,
          `.test-${Date.now()}.tmp`
        );
        try {
          fs.writeFileSync(testFilePath, "test");
          fs.unlinkSync(testFilePath); // Clean up test file
          return; // Directory is confirmed working!
        } catch (error) {
          console.log(
            `Directory exists but isn't writable yet. Retrying... (${
              attempt + 1
            }/${maxRetries})`
          );
        }
      } else {
        console.log(
          `Directory still not found. Retrying creation... (${
            attempt + 1
          }/${maxRetries})`
        );
        try {
          fs.mkdirSync(directoryPath, { recursive: true });
        } catch (err) {
          console.error(
            `Error creating directory on attempt ${attempt + 1}:`,
            err
          );
        }
      }

      // Wait before next retry
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }

    // Final check
    if (!fs.existsSync(directoryPath)) {
      throw new Error(
        `Failed to create directory after ${maxRetries} attempts: ${directoryPath}`
      );
    }
  }
}
