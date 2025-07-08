import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

export class SupabaseStorageService {
  private supabase: SupabaseClient;
  private readonly storageBucket: string;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required"
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.storageBucket = process.env.SUPABASE_STORAGE_BUCKET || "video-assets";
  }

  /**
   * Upload a buffer to Supabase storage
   */
  async uploadBuffer(
    buffer: Buffer,
    storageKey: string,
    contentType: string
  ): Promise<string> {
    try {
      const { error: uploadError } = await this.supabase.storage
        .from(this.storageBucket)
        .upload(storageKey, buffer, {
          contentType,
          cacheControl: "31536000",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Failed to upload buffer: ${uploadError.message}`);
      }

      const { data: publicUrlData } = this.supabase.storage
        .from(this.storageBucket)
        .getPublicUrl(storageKey);

      console.log(
        `✅ Uploaded buffer to supabase://${this.storageBucket}/${storageKey}`
      );
      return publicUrlData.publicUrl;
    } catch (error: any) {
      console.error(`❌ Error uploading buffer to Supabase: ${error.message}`);
      throw error;
    }
  }

  /**
   * Download a file from Supabase storage
   */
  async downloadFile(storageKey: string, outputPath: string): Promise<string> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.storageBucket)
        .download(storageKey);

      if (error) {
        throw new Error(`Failed to download file: ${error.message}`);
      }

      const buffer = Buffer.from(await data.arrayBuffer());

      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(outputPath, buffer);
      console.log(`✅ Downloaded ${storageKey} to ${outputPath}`);

      return outputPath;
    } catch (error: any) {
      console.error(`❌ Error downloading from Supabase: ${error.message}`);
      throw error;
    }
  }

  /**
   * Download file as buffer
   */
  async downloadAsBuffer(storageKey: string): Promise<Buffer> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.storageBucket)
        .download(storageKey);

      if (error) {
        throw new Error(`Failed to download file: ${error.message}`);
      }

      return Buffer.from(await data.arrayBuffer());
    } catch (error: any) {
      console.error(`❌ Error downloading from Supabase: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(storageKey: string): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from(this.storageBucket)
        .remove([storageKey]);

      if (error) {
        throw new Error(`Failed to delete file: ${error.message}`);
      }

      console.log(`✅ Deleted ${storageKey} from Supabase storage`);
    } catch (error: any) {
      console.error(`❌ Error deleting file from Supabase: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get a public URL for a file
   */
  getPublicUrl(storageKey: string): string {
    const { data } = this.supabase.storage
      .from(this.storageBucket)
      .getPublicUrl(storageKey);

    return data.publicUrl;
  }

  /**
   * Generate storage paths for scene images
   */
  getSceneImagePath(
    userId: string,
    projectId: string,
    sceneIndex: number
  ): string {
    return `users/${userId}/projects/${projectId}/scenes/scene-${sceneIndex}/image.webp`;
  }

  /**
   * Generate storage paths for scene videos
   */
  getSceneVideoPath(
    userId: string,
    projectId: string,
    sceneIndex: number
  ): string {
    return `users/${userId}/projects/${projectId}/scenes/scene-${sceneIndex}/video.mp4`;
  }

  /**
   * Generate storage paths for scene voice over
   */
  getSceneVoiceOverPath(
    userId: string,
    projectId: string,
    sceneIndex: number
  ): string {
    return `users/${userId}/projects/${projectId}/scenes/scene-${sceneIndex}/voice-over.wav`;
  }

  /**
   * Generate storage paths for character images
   */
  getCharacterImagePath(userId: string, characterId: string): string {
    return `users/${userId}/characters/${characterId}/image.webp`;
  }

  /**
   * Generate storage paths for music
   */
  getMusicPath(userId: string, projectId: string): string {
    return `users/${userId}/projects/${projectId}/background-music.wav`;
  }

  /**
   * Generate storage paths for custom thumbnails
   */
  getThumbnailPath(userId: string, projectId: string): string {
    return `users/${userId}/projects/${projectId}/thumbnail.jpg`;
  }

  /**
   * Generate storage paths for final video
   */
  getFinalVideoPath(userId: string, projectId: string): string {
    return `users/${userId}/projects/${projectId}/final-video.mp4`;
  }
}
