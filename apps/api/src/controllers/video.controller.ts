import { VideoService } from "../services/video.service";

export class VideoController {
  private videoService: VideoService;

  constructor(videoService: VideoService) {
    this.videoService = videoService;
  }

  async startVideoGeneration(videoId: string, userId: string) {
    return await this.videoService.startVideoJob(userId, videoId);
  }

  async getVideoSignedUrls(videoId: string, userId: string, version?: number) {
    return await this.videoService.getVideoSignedUrls(userId, videoId, version);
  }
}
