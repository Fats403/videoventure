import {
  S3Client,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import * as fs from "fs";

export class S3Service {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
    });
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
      const fileContent = fs.readFileSync(filePath);

      const params = {
        Bucket: bucketName,
        Key: key,
        Body: fileContent,
      };

      const command = new PutObjectCommand(params);
      await this.s3Client.send(command);
    } catch (error: any) {
      console.error(`Error uploading to S3: ${error.message}`);
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
}
