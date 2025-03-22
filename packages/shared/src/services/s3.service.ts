import {
  S3Client,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import * as fs from "fs";

export class S3Service {
  private s3Client: S3Client;
  private readonly s3BucketName: string;
  private readonly urlExpirationSeconds: number;

  constructor() {
    this.s3BucketName = process.env.S3_BUCKET_NAME || "";
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
    });
    this.urlExpirationSeconds = parseInt(
      process.env.SIGNED_URL_EXPIRATION_SECONDS || "604800"
    );
  }

  /**
   * Upload a file to S3
   * @param filePath - Path to the local file
   * @param bucketName - S3 bucket name
   * @param key - S3 object key
   */
  async uploadFile(
    filePath: string,
    bucketName: string,
    key: string
  ): Promise<void> {
    try {
      const fileStream = fs.createReadStream(filePath);
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: fileStream,
      });

      await this.s3Client.send(command);
      console.log(`✅ Uploaded ${filePath} to s3://${bucketName}/${key}`);
    } catch (error: any) {
      console.error(`❌ Error uploading to S3: ${error.message}`);
      throw error;
    }
  }

  /**
   * Download a file from S3
   * @param bucketName - S3 bucket name
   * @param key - S3 object key
   * @param outputPath - Path to save the downloaded file
   */
  async downloadFile(
    bucketName: string,
    key: string,
    outputPath: string
  ): Promise<string> {
    try {
      // Get the object
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const { Body } = await this.s3Client.send(getCommand);
      if (!Body) {
        throw new Error(`No body returned for S3 object: ${bucketName}/${key}`);
      }

      // Write the file to disk
      const writeStream = fs.createWriteStream(outputPath);
      // @ts-ignore - Body has pipe method but TypeScript doesn't recognize it
      Body.pipe(writeStream);

      return new Promise((resolve, reject) => {
        writeStream.on("finish", () => {
          resolve(outputPath);
        });

        writeStream.on("error", (err) => {
          reject(new Error(`Failed to write file: ${err.message}`));
        });
      });
    } catch (error: any) {
      console.error(`Error downloading from S3: ${error.message}`);
      throw error;
    }
  }

  /**
   * List objects in an S3 bucket with a prefix
   * @param bucketName - S3 bucket name
   * @param prefix - Prefix to filter objects
   */
  async listObjects(bucketName: string, prefix: string): Promise<string[]> {
    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
      });

      const listResponse = await this.s3Client.send(listCommand);

      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        return [];
      }

      return listResponse.Contents.map((obj) => obj.Key as string);
    } catch (error: any) {
      console.error(`Error listing S3 objects: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find a file in S3 with a specific extension
   * @param bucketName - S3 bucket name
   * @param prefix - Prefix to search in
   * @param extension - File extension to look for
   */
  async findFileWithExtension(
    bucketName: string,
    prefix: string,
    extension: string
  ): Promise<string | null> {
    const objects = await this.listObjects(bucketName, prefix);
    const file = objects.find((key) => key.endsWith(extension));
    return file || null;
  }

  async getSignedUrl(s3Key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.s3BucketName,
      Key: s3Key,
    });

    try {
      return await getSignedUrl(this.s3Client, command, {
        expiresIn: this.urlExpirationSeconds,
      });
    } catch (error) {
      console.error(`Error generating signed URL for ${s3Key}:`, error);
      throw error;
    }
  }

  async s3UriToSignedUrl(s3Uri: string): Promise<string> {
    const s3Key = s3Uri.replace(`s3://${this.s3BucketName}/`, "");
    return this.getSignedUrl(s3Key);
  }

  /**
   * Generate S3 paths for a video
   * @param userId - User ID
   * @param videoId - Video ID
   * @param version - Version number of the video
   * @returns Object containing paths for video assets
   */
  getVideoPaths(userId: string, videoId: string, version: number = 1) {
    return {
      video: `${userId}/${videoId}/video/final_v${version}.mp4`,
      thumbnail: `${userId}/${videoId}/video/thumbnail.jpg`,
      music: `${userId}/${videoId}/audio/music.mp3`,
    };
  }

  /**
   * Generate S3 paths for a specific scene
   * @param userId - User ID
   * @param videoId - Video ID
   * @param sceneNumber - Scene number
   * @param version - Version number of the scene
   * @returns Object containing paths for scene assets
   */
  getScenePaths(
    userId: string,
    videoId: string,
    sceneNumber: number,
    version: number = 1
  ) {
    return {
      video: `${userId}/${videoId}/scenes/scene_${sceneNumber}/video_v${version}.mp4`,
      audio: `${userId}/${videoId}/scenes/scene_${sceneNumber}/audio_v${version}.mp3`,
    };
  }

  /**
   * Generate signed URLs for video assets
   * @param userId - User ID
   * @param videoId - Video ID
   * @param version - Version number of the video
   * @param expiresIn - Expiration time in seconds
   * @returns Object containing signed URLs and expiry date
   */
  async generateSignedUrls(
    userId: string,
    videoId: string,
    version: number = 1,
    expiresIn = this.urlExpirationSeconds
  ) {
    const paths = this.getVideoPaths(userId, videoId, version);

    const videoUrl = await this.getSignedUrl(paths.video);
    const thumbnailUrl = await this.getSignedUrl(paths.thumbnail);

    return {
      videoUrl,
      thumbnailUrl,
      expiryDate: new Date(Date.now() + expiresIn * 1000).toISOString(),
    };
  }

  /**
   * Generate signed URLs for scene assets
   * @param userId - User ID
   * @param videoId - Video ID
   * @param sceneNumber - Scene number
   * @param version - Version number of the scene
   * @param expiresIn - Expiration time in seconds
   * @returns Object containing signed URLs for scene assets
   */
  async generateSceneSignedUrls(
    userId: string,
    videoId: string,
    sceneNumber: number,
    version: number = 1,
    expiresIn = 3600
  ) {
    const paths = this.getScenePaths(userId, videoId, sceneNumber, version);

    const videoUrl = await this.getSignedUrl(paths.video);
    const audioUrl = await this.getSignedUrl(paths.audio);

    return {
      videoUrl,
      audioUrl,
      expiryDate: new Date(Date.now() + expiresIn * 1000).toISOString(),
    };
  }
}
