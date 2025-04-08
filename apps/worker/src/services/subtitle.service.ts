import * as fs from "fs";
import * as path from "path";
import ffmpeg from "fluent-ffmpeg";
import { WordTimestamp } from "./audio.service";

export class SubtitleService {
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

    const defaultFontFile = "integral-cf.otf";

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
   * Ensure a directory exists and verify it exists afterwards
   */
  private async ensureDirectoryExistsWithVerification(
    dirPath: string
  ): Promise<void> {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });

      // Verify the directory was created
      if (!fs.existsSync(dirPath)) {
        throw new Error(`Failed to create directory: ${dirPath}`);
      }
    }
  }

  /**
   * Format color input (supporting hex values, named colors, and RGBA formats)
   */
  private formatColor(color: string): string {
    // If it's a hex value, convert it to FFmpeg format
    if (color.startsWith("#")) {
      // Remove # and make sure it's 6 characters
      const hex = color.substring(1).padEnd(6, "0");
      // Extract rgb components and convert to decimal
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      // Format for FFmpeg (which uses 0xRRGGBB format)
      return `0x${hex}`;
    }
    return color;
  }

  /**
   * Properly escape text for FFmpeg drawtext filter
   * Strictly limits to alphanumerics and basic punctuation (?!.,)
   */
  private escapeForFFmpeg(text: string): string {
    // First, strip all characters except alphanumerics and ?!.,
    // This ensures NO other characters can appear in the output
    const strippedText = text.replace(/[^a-zA-Z0-9\s?]/g, "");

    // Only escape the punctuation that needs escaping for FFmpeg filter syntax
    return strippedText;
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
      position?: "top" | "top-center" | "center" | "bottom-center" | "bottom";
    } = {},
    startOffset: number = 0
  ): Promise<string> {
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Input video not found at ${videoPath}`);
    }

    // Set default styling options
    const style = {
      fontSize: options.fontSize || 72,
      textColor: this.formatColor(options.textColor || "white"),
      outlineColor: this.formatColor(options.outlineColor || "black"),
      outlineThickness: options.outlineThickness || "normal",
      fontPath: this.getFontPath(options.customFontPath),
      position: options.position || "center",
    };

    console.log(`Using font: ${style.fontPath}`);

    // Build position setting based on chosen position
    let yPosition = "(h-text_h)/2"; // Default: center
    if (style.position === "top") {
      yPosition = "100"; // 100 pixels from top
    } else if (style.position === "top-center") {
      yPosition = "h*0.25"; // 25% from the top
    } else if (style.position === "bottom-center") {
      yPosition = "h*0.75-text_h"; // 75% from the top (adjusted for text height)
    } else if (style.position === "bottom") {
      yPosition = "h-text_h-100"; // 100 pixels from bottom
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

    // Process words based on count
    if (wordTimestamps.length > 30) {
      console.log(
        `Using batched processing for ${wordTimestamps.length} words`
      );
      return this.addSubtitlesWithBatching(
        videoPath,
        wordTimestamps,
        outputPath,
        style,
        yPosition,
        borderWidth,
        startOffset
      );
    } else {
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

    // Performance measurement
    const startTime = Date.now();

    // Generate filter commands for each word
    const filterCommands = words.map((word) => {
      const adjustedStart = word.start + startOffset;
      const adjustedEnd = word.end + startOffset;

      // Animation duration - make it shorter for better performance
      const animDuration = 0.2; // 200ms
      const popEnd = adjustedStart + animDuration;

      // Better character escaping while preserving special characters
      const safeWord = this.escapeForFFmpeg(word.word);

      // Simplified expression for bounce effect
      // Use a single sine function with offset instead of the complex expression
      return (
        `drawtext=text='${safeWord}':fontcolor=${style.textColor}:` +
        `fontsize='if(lt(t,${popEnd}),` +
        // Simpler curve: Start at 70%, grow to 110%, settle at 100%
        `${style.fontSize * 0.7}+${
          style.fontSize * 0.4
        }*sin(PI/2*(t-${adjustedStart})/${animDuration}),` +
        `${style.fontSize})':` +
        `fontfile=${style.fontPath}:` +
        `x=(w-text_w)/2:y=${yPosition}:` +
        `enable='between(t,${adjustedStart},${adjustedEnd})':` +
        `borderw=${borderWidth}:bordercolor=${style.outlineColor}`
      );
    });

    // Join all filter commands with comma
    const filterString = filterCommands.join(",");

    console.log(
      `Created filter with ${words.length} words using optimized bounce animation`
    );

    // Run with performance optimizations
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .outputOptions([
          "-c:v libx264",
          "-c:a copy",
          "-preset ultrafast", // Use ultrafast preset for faster processing
        ])
        .videoFilters(filterString)
        .output(outputPath)
        .on("progress", (progress) => {
          if (progress.percent) {
            console.log(`Adding subtitles: ${Math.floor(progress.percent)}%`);
          }
        })
        .on("error", (err) => {
          console.error("FFmpeg error:", err.message);
          reject(err);
        })
        .on("end", () => {
          const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(
            `✅ Added subtitles with bounce effect in ${processingTime}s`
          );
          resolve(outputPath);
        })
        .run();
    });
  }

  /**
   * Process subtitles in batches for better performance with large word sets
   */
  private async addSubtitlesWithBatching(
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
    // Smaller batch size for better compatibility
    const BATCH_SIZE = 15;

    console.log(`Processing ${words.length} words in batches of ${BATCH_SIZE}`);

    // Split words into time-ordered batches
    const batches: WordTimestamp[][] = [];
    for (let i = 0; i < words.length; i += BATCH_SIZE) {
      batches.push(words.slice(i, i + BATCH_SIZE));
    }

    console.log(`Created ${batches.length} processing batches`);

    // Performance measurement
    const totalStartTime = Date.now();

    try {
      // Process each batch sequentially
      let currentInput = videoPath;
      let tempFiles: string[] = [];

      for (let i = 0; i < batches.length; i++) {
        // Create temp file path in the same directory as output
        const batchOutput = path.join(
          path.dirname(outputPath),
          `batch_${i}_${path.basename(outputPath)}`
        );
        tempFiles.push(batchOutput);

        console.log(
          `Processing batch ${i + 1}/${batches.length} (${
            batches[i].length
          } words)`
        );

        // Process this batch
        await this.addSubtitlesSimple(
          currentInput,
          batches[i],
          batchOutput,
          style,
          yPosition,
          borderWidth,
          startOffset
        );

        // Next batch will use the previous output as input
        currentInput = batchOutput;
      }

      // Rename the final temp file to the desired output path
      fs.renameSync(currentInput, outputPath);

      // Clean up temporary files (skip the last one since we renamed it)
      for (const file of tempFiles.slice(0, -1)) {
        if (fs.existsSync(file)) {
          try {
            fs.unlinkSync(file);
            console.log(`Removed temp file: ${file}`);
          } catch (err) {
            console.warn(`Warning: Could not remove temp file ${file}`, err);
          }
        }
      }

      const totalProcessingTime = (
        (Date.now() - totalStartTime) /
        1000
      ).toFixed(2);
      console.log(`✅ Completed batch processing in ${totalProcessingTime}s`);

      return outputPath;
    } catch (error) {
      console.error("Error in batch processing:", error);
      // In case of error, try processing all at once as fallback
      console.log("Attempting fallback to single-batch processing...");
      return this.addSubtitlesSimple(
        videoPath,
        words,
        outputPath,
        style,
        yPosition,
        borderWidth,
        startOffset
      );
    }
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
      position?: "top" | "top-center" | "center" | "bottom-center" | "bottom";
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
}
