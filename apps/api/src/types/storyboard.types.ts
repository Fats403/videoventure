export interface Scene {
  scene_number: number;
  visual_description: string;
  voiceover: string;
}

export interface StoryboardResult {
  scenes: Scene[];
  visualStyle: string;
  tags: string[];
  title: string;
}
