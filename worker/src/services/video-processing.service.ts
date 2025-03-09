import * as fs from "fs";
import * as path from "path";
import ffmpeg from "fluent-ffmpeg";
import { S3Service } from "./s3.service";
import { blendVideos, type TransitionType } from "ffmpeg-transitions";

export interface SceneWithAudio {
  sceneNumber: number;
  videoPath: string;
  audioPath: string;
  duration: number;
  s3Key: string;
}

export class VideoProcessingService {
  private s3Service: S3Service;

  constructor() {
    this.s3Service = new S3Service();
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

    // If audio is longer than video, we need to slow down the video
    let slowdownFactor = 1;
    if (audioDuration > videoDuration) {
      slowdownFactor = audioDuration / videoDuration;
      console.log(
        `Extending video to match audio duration (factor: ${slowdownFactor.toFixed(
          2
        )})`
      );
    }

    return new Promise((resolve, reject) => {
      const ffmpegCommand = ffmpeg();

      ffmpegCommand
        .input(videoPath)
        .input(audioPath)
        .complexFilter([
          // Slow down the video to match audio duration using setpts filter
          `[0:v]setpts=${slowdownFactor}*PTS[slowv]`,
        ])
        .outputOptions([
          "-map [slowv]", // Use the slowed down video
          "-map 1:a", // Use audio from second input
          "-r 24", // Explicitly set output frame rate to 24fps
          "-c:v libx264", // Use H.264 codec
          "-preset medium", // Encoding preset
          "-crf 23", // Quality level
          "-pix_fmt yuv420p", // Pixel format for compatibility
        ])
        .output(outputPath)
        .on("progress", (progress) => {
          if (progress.percent) {
            console.log(`Processing: ${Math.floor(progress.percent)}%`);
          }
        })
        .on("error", (err) => {
          reject(err);
        })
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
          "-shortest", // Finish encoding when the shortest input stream ends
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
   * Download a video file from S3
   * @param s3BucketName - S3 bucket name
   * @param s3Key - S3 object key prefix
   * @param outputPath - Path to save downloaded video
   * @returns Path to downloaded video
   */
  async downloadVideoFromS3(
    s3BucketName: string,
    s3Key: string,
    outputPath: string
  ): Promise<string> {
    try {
      // Find the MP4 file in the S3 prefix
      const mp4File = await this.s3Service.findFileWithExtension(
        s3BucketName,
        s3Key,
        ".mp4"
      );

      if (!mp4File) {
        throw new Error(`No MP4 file found in S3 at ${s3BucketName}/${s3Key}`);
      }

      // Download the file
      return await this.s3Service.downloadFile(
        s3BucketName,
        mp4File,
        outputPath
      );
    } catch (error: any) {
      console.error(`Error downloading video from S3: ${error.message}`);
      throw error;
    }
  }

  async generateThumbnail(
    videoPath: string,
    outputPath: string,
    timeInSeconds = 1
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: [timeInSeconds],
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
          size: "1280x720", // 720p thumbnail
        })
        .on("end", () => {
          console.log("✅ Thumbnail generated successfully");
          resolve(outputPath);
        })
        .on("error", (err) => {
          console.error("❌ Error generating thumbnail:", err);
          reject(err);
        });
    });
  }
}
