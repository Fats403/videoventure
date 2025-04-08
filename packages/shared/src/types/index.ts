export type JobType = "CREATE_VIDEO" | "UPDATE_SCENE" | "REGENERATE_VIDEO";
export type JobStatus = "QUEUED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
export type VideoVisibility = "PUBLIC" | "PRIVATE";
export type VideoOrientation = "PORTRAIT" | "LANDSCAPE";

export interface Scene {
  sceneNumber: number;
  description: string;
  voiceover: string;
}

export interface StoryboardResult {
  scenes: Scene[];
  musicDescription: string;
  tags: string[];
  title: string;
}

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
  params: {
    voiceId: string;
    videoModel: string;
    providerConfig?: Record<string, any>;
  };
  progress?: {
    currentStep: string;
    completedSteps: number;
    totalSteps: number;
    percentComplete: number;
  };
  error?: string;
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
