export interface JobResult {
  videoId: string;
  localVideoPath: string;
  s3VideoPath: string;
  s3StoryboardPath: string;
  visualStyle: string;
  s3MusicPath: string;
  scenes: {
    sceneNumber: number;
    videoS3Path: string;
    audioS3Path: string;
  }[];
}
