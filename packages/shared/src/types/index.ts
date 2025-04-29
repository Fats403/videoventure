export type JobType = "CREATE_VIDEO" | "UPDATE_SCENE" | "REGENERATE_VIDEO";
export type VideoStatus =
  | "CREATED"
  | "QUEUED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";
export type VideoVisibility = "PUBLIC" | "PRIVATE";
export type VideoOrientation = "PORTRAIT" | "LANDSCAPE" | "SQUARE";

export interface Scene {
  sceneNumber: number;
  description: string;
  voiceover: string;
  version?: number;
  duration?: number;
}

export interface StoryboardResult {
  scenes: Scene[];
  musicDescription: string;
  tags: string[];
  title: string;
}

export interface Job {
  jobId: string;
  videoId: string;
  userId: string;
  type: JobType;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Video {
  videoId: string;
  userId: string;
  visibility: VideoVisibility;
  duration: number;
  views: number;
  originalConcept: string;
  voiceId: string;
  videoModel: string;
  providerConfig: Record<string, any>;
  version: number;
  storyboard: StoryboardResult;
  status: VideoStatus;
  currentJobId?: string;
  progress?: {
    currentStep: string;
    completedSteps: number;
    totalSteps: number;
    percentComplete: number;
  };
  processingHistory?: {
    jobId: string;
    type: JobType;
    status: VideoStatus;
    timestamp: string;
  }[];
  error?: string;
  createdAt: string;
  updatedAt: string;
}
