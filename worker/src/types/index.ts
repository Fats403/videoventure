export interface Job {
  jobId: string;
  storyIdea: string;
  maxScenes: number;
  voiceId: string;
  status: "QUEUED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  createdAt: string;
  updatedAt: string;
  result?: JobResult;
  error?: string;
}

export interface JobResult {
  videoId?: string;
  localVideoPath?: string;
  s3VideoPath?: string;
  s3StoryboardPath?: string;
  scenes?: Scene[];
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
  title: string;
  description: string;
  visibility: "PUBLIC" | "PRIVATE";
  userId: string;
  jobId: string;
  s3Path: string;
  thumbnailUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  duration?: number;
  views: number;
  tags: string[];
}
