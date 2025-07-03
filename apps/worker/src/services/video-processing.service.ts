import * as fs from "fs";
import * as path from "path";
import ffmpeg from "fluent-ffmpeg";
import { SupabaseStorageService } from "@video-venture/shared/server";
import { blendVideos, type TransitionType } from "ffmpeg-transitions";

export interface SceneWithAudio {
  sceneNumber: number;
  videoPath: string;
  audioPath: string;
  duration: number;
  storageKey: string;
}

export class VideoProcessingService {
  private storageService: SupabaseStorageService;

  constructor() {
    this.storageService = new SupabaseStorageService();
  }

  /**
   * Add audio to a video file
   * @param videoPath - Path to video file
   * @param audioPath - Path to audio file
   * @param outputPath - Path to save combined video
   * @returns Path to combined video
   */
  async addAudioToVideo(
    videoPath: string,
    audioPath: string,
    outputPath: string
  ): Promise<string> {
    // Get durations of video and audio
    const [videoDuration, audioDuration] = await Promise.all([
      this.getVideoDuration(videoPath),
      this.getVideoDuration(audioPath),
    ]);

    // Determine if we need to adjust video timing
    const isAudioLonger = audioDuration > videoDuration;
    const isAudioShorter = audioDuration < videoDuration;

    // Log appropriate message
    if (isAudioLonger) {
      const slowdownFactor = audioDuration / videoDuration;
      console.log(
        `Extending video to match audio duration (factor: ${slowdownFactor.toFixed(
          2
        )})`
      );
    } else if (isAudioShorter) {
      console.log(
        `Audio (${audioDuration.toFixed(
          2
        )}s) is shorter than video (${videoDuration.toFixed(
          2
        )}s), trimming video to match`
      );
    }

    // Create complex filter and output options
    const slowdownFactor = isAudioLonger ? audioDuration / videoDuration : 1;

    // Build the filter chain
    const filters = [`[0:v]setpts=${slowdownFactor}*PTS[slowv]`];
    if (isAudioShorter) {
      filters.push(`[slowv]trim=0:${audioDuration}[trimmed]`);
    }

    // Determine which video stream to map
    const videoMapping = isAudioShorter ? "-map [trimmed]" : "-map [slowv]";

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(videoPath)
        .input(audioPath)
        .complexFilter(filters)
        .outputOptions([
          videoMapping,
          "-map 1:a", // Use audio from second input
          "-r 24", // 24fps output
          "-c:v libx264", // H.264 video codec
          "-preset medium", // Encoding speed/quality balance
          "-crf 23", // Quality level
          "-pix_fmt yuv420p", // Pixel format for compatibility
        ])
        .output(outputPath)
        .on("progress", (progress) => {
          if (progress.percent) {
            console.log(`Processing: ${Math.floor(progress.percent)}%`);
          }
        })
        .on("error", (err) => reject(err))
        .on("end", () => {
          console.log(`✅ Added audio to video`);
          resolve(outputPath);
        })
        .run();
    });
  }

  /**
   * Combine multiple videos into a single video
   * @param videoPaths - Array of video file paths
   * @param outputPath - Path to save combined video
   * @returns Path to combined video
   */
  async combineVideos(
    videoPaths: string[],
    outputPath: string,
    transitionType: string = "fade",
    transitionDuration: number = 1.0
  ): Promise<string> {
    if (videoPaths.length === 0) {
      throw new Error("No videos to combine");
    }

    if (videoPaths.length === 1) {
      // If there's only one video, just copy it
      fs.copyFileSync(videoPaths[0], outputPath);
      return outputPath;
    }

    // Use ffmpeg-transitions to combine videos with transitions
    return new Promise((resolve, reject) => {
      blendVideos(
        videoPaths,
        outputPath,
        transitionType as TransitionType,
        transitionDuration,
        (err, result) => {
          if (err) {
            console.error("❌ Error combining videos:", err);
            return reject(err);
          }

          console.log(`✅ Combined ${videoPaths.length} videos`);
          resolve(outputPath);
        }
      );
    });
  }

  /**
   * Add background music to a video
   * @param videoPath - Path to video file
   * @param musicPath - Path to music file
   * @param outputPath - Path to save video with music
   * @returns Path to video with music
   */
  async addMusicToVideo(
    videoPath: string,
    musicPath: string,
    outputPath: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .input(musicPath)
        .outputOptions([
          "-c:v copy", // Copy video stream without re-encoding
          "-c:a aac", // Use AAC codec for audio
          "-filter_complex [0:a]volume=1[a1];[1:a]volume=0.3,aloop=loop=-1:size=2e+09[a2];[a1][a2]amix=inputs=2:duration=first[aout]", // Mix audio streams, loop music, reduce music volume
          "-map 0:v:0", // Map video from first input
          "-map [aout]", // Map mixed audio
        ])
        .output(outputPath)
        .on("error", (err) => {
          console.error(`Error adding music to video: ${err.message}`);
          reject(err);
        })
        .on("end", () => {
          console.log(`✅ Added background music to video: ${outputPath}`);
          resolve(outputPath);
        })
        .run();
    });
  }

  /**
   * Get the duration of a video file in seconds
   * @param videoPath - Path to video file
   * @returns Duration in seconds
   */
  async getVideoDuration(videoPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          console.error(`Error getting video duration: ${err.message}`);
          reject(err);
          return;
        }

        const duration = metadata.format.duration || 0;
        resolve(duration);
      });
    });
  }

  /**
   * Download video from Supabase storage
   * @param storageKey - Supabase storage key
   * @param outputPath - Path to save downloaded video
   * @returns Path to downloaded video
   */
  async downloadVideoFromStorage(
    storageKey: string,
    outputPath: string
  ): Promise<string> {
    try {
      await this.storageService.downloadFile(storageKey, outputPath);
      console.log(`✅ Downloaded video from Supabase: ${storageKey}`);
      return outputPath;
    } catch (error: any) {
      console.error(`❌ Error downloading video from Supabase:`, error.message);
      throw error;
    }
  }

  /**
   * Upload file to Supabase storage
   * @param filePath - Local file path
   * @param storageKey - Supabase storage key
   * @param contentType - MIME type of the file
   * @returns Public URL of uploaded file
   */
  async uploadFileToStorage(
    filePath: string,
    storageKey: string,
    contentType: string
  ): Promise<string> {
    try {
      const buffer = fs.readFileSync(filePath);
      const url = await this.storageService.uploadBuffer(
        buffer,
        storageKey,
        contentType
      );

      // Clean up local file
      fs.unlinkSync(filePath);

      console.log(`✅ Uploaded file to Supabase: ${storageKey}`);
      return url;
    } catch (error: any) {
      console.error(`❌ Error uploading file to Supabase:`, error.message);
      throw error;
    }
  }

  /**
   * Generate thumbnail from video
   * @param videoPath - Path to video file
   * @param outputPath - Path to save thumbnail
   * @param timeInSeconds - Time in video to capture thumbnail
   * @param aspectRatio - Aspect ratio for thumbnail size
   * @returns Path to generated thumbnail
   */
  async generateThumbnail(
    videoPath: string,
    outputPath: string,
    timeInSeconds: number = 1,
    aspectRatio: "16:9" | "1:1" | "9:16" = "16:9"
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .seekInput(timeInSeconds)
        .frames(1)
        .size(this.getThumbnailSize(aspectRatio))
        .output(outputPath)
        .on("error", (err) => {
          console.error(`Error generating thumbnail: ${err.message}`);
          reject(err);
        })
        .on("end", () => {
          console.log(`✅ Generated thumbnail: ${outputPath}`);
          resolve(outputPath);
        })
        .run();
    });
  }

  /**
   * Get thumbnail size based on aspect ratio
   */
  private getThumbnailSize(aspectRatio: "16:9" | "1:1" | "9:16"): string {
    switch (aspectRatio) {
      case "16:9":
        return "1280x720";
      case "1:1":
        return "720x720";
      case "9:16":
        return "720x1280";
      default:
        return "1280x720";
    }
  }
}
