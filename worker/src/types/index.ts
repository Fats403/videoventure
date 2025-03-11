export type JobType = "CREATE_VIDEO" | "UPDATE_SCENE" | "REGENERATE_VIDEO";
export type JobStatus = "QUEUED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
export type VideoVisibility = "PUBLIC" | "PRIVATE";
export type VideoOrientation = "PORTRAIT" | "LANDSCAPE";

export interface SceneData {
  sceneNumber: number;
  description: string;
  voiceover: string;
  duration: number;
  version: number; // Track version of this scene
}

export interface Job {
  jobId: string;
  videoId: string;
  userId: string;
  type: JobType;
  status: JobStatus;
  error?: string;
  params: {
    inputConcept: string;
    maxScenes: number;
    voiceId: string;
    orientation: VideoOrientation;
    sceneNumber?: number; // For UPDATE_SCENE jobs
    voiceover?: string; // For UPDATE_SCENE jobs
    visualStyle?: string; // For REGENERATE_VIDEO jobs
  };
  progress?: {
    currentStep: string;
    completedSteps: number;
    totalSteps: number;
    percentComplete: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Video {
  videoId: string;
  userId: string;
  title: string;
  orientation: VideoOrientation;
  visibility: VideoVisibility;
  duration: number;
  views: number;
  tags: string[];

  // Technical data
  originalConcept: string;
  visualStyle: string;
  version: number; // Track version of the full video
  scenes: SceneData[];

  // Processing status
  currentJobId?: string;
  processingHistory?: {
    jobId: string;
    type: JobType;
    status: JobStatus;
    timestamp: string;
  }[];

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface VideoWithUrls extends Video {
  videoUrl: string;
  thumbnailUrl: string;
  sceneUrls?: {
    sceneNumber: number;
    videoUrl: string;
    audioUrl: string;
  }[];
  urlExpiryDate: string;
}
