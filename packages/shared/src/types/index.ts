export type JobType = "CREATE_VIDEO" | "UPDATE_SCENE" | "REGENERATE_VIDEO";
export type JobStatus = "QUEUED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
export type VideoVisibility = "PUBLIC" | "PRIVATE";
export type VideoOrientation = "PORTRAIT" | "LANDSCAPE";

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
  status: JobStatus;
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
  visibility: VideoVisibility;
  duration: number;
  views: number;
  originalConcept: string;
  voiceId: string;
  videoModel: string;
  providerConfig: Record<string, any>;
  version: number;
  storyboard: StoryboardResult;
  currentJobId?: string;
  processingHistory?: {
    jobId: string;
    type: JobType;
    status: JobStatus;
    timestamp: string;
  }[];
  createdAt: string;
  updatedAt: string;
}
