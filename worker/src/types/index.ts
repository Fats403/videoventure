export type JobType = "CREATE_VIDEO" | "UPDATE_SCENE" | "REGENERATE_VIDEO";
export type JobStatus = "QUEUED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
export type VideoVisibility = "PUBLIC" | "PRIVATE";

export interface SceneData {
  sceneNumber: number;
  description: string;
  voiceover: string;
  duration: number;
  videoPath: string;
  audioPath: string;
}

export interface Job {
  jobId: string;
  videoId: string;
  userId: string;
  type: JobType;
  status: JobStatus;
  error?: string;
  params: {
    storyIdea?: string;
    sceneNumber?: number;
    voiceover?: string;
    voiceId?: string;
    visualStyle?: string;
    maxScenes?: number;
  };
  result?: {
    videoPath: string;
    thumbnailPath: string;
    s3MusicPath: string;
    scenes: SceneData[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface JobResult {
  videoId: string;
  status: JobStatus;
  error?: string;
  result?: {
    videoPath: string; // S3 path
    videoUrl: string; // Signed URL
    thumbnailPath: string; // S3 path
    thumbnailUrl: string; // Signed URL
    s3MusicPath: string; // S3 path
    scenes: SceneData[];
    visualStyle: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Scene {
  id: string;
  text: string;
  imagePrompt?: string;
  imageUrl?: string;
  audioUrl?: string;
  duration?: number;
}

export interface Video {
  videoId: string;
  userId: string;
  title: string;
  description: string;
  visibility: VideoVisibility;
  duration: number;
  views: number;
  tags: string[];

  // URLs and paths
  videoUrl: string;
  thumbnailUrl: string;
  s3Paths: {
    video: string;
    thumbnail: string;
    music: string;
  };

  // Technical data
  originalStoryIdea: string;
  visualStyle: string;
  scenes: SceneData[];

  // Processing status
  processingStatus: JobStatus;
  currentJobId?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  urlExpiryDate: string;
}
