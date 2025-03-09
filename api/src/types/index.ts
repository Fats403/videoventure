export type JobType = "CREATE_VIDEO" | "UPDATE_SCENE" | "REGENERATE_VIDEO";
export type JobStatus = "QUEUED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
export type VideoVisibility = "PUBLIC" | "PRIVATE";

export interface Job {
  jobId: string; // nanoid()
  videoId: string; // video this job is for
  type: JobType; // what kind of processing
  userId: string;
  status: JobStatus;
  error?: string;
  params: {
    storyIdea?: string; // for CREATE_VIDEO/REGENERATE_VIDEO
    sceneNumber?: number; // for UPDATE_SCENE
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

export interface SceneData {
  sceneNumber: number;
  description: string;
  voiceover: string;
  duration: number;
  videoPath: string; // S3 path
  audioPath: string; // S3 path
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
  videoId: string; // separate from jobId
  title: string;
  description: string;
  visibility: VideoVisibility;
  userId: string;
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

  // Technical data for editing
  originalStoryIdea: string;
  visualStyle: string;
  scenes: SceneData[];

  // Processing status
  processingStatus: JobStatus;
  currentJobId?: string; // latest job working on this video

  // Timestamps
  createdAt: string;
  updatedAt: string;
  urlExpiryDate: string;
}
