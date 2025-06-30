import { StoryboardService } from "../services/storyboard.service";
import {
  StoryboardRequest,
  SceneBreakdownRequest,
} from "../schemas/storyboard.schema";

export class StoryboardController {
  private storyboardService: StoryboardService;

  constructor(storyboardService: StoryboardService) {
    this.storyboardService = storyboardService;
  }

  async generateVariants(data: StoryboardRequest) {
    return await this.storyboardService.generateInitialVariants(data);
  }

  async generateAdditionalVariant(data: StoryboardRequest) {
    return await this.storyboardService.generateAdditionalVariant(data);
  }

  async generateSceneBreakdown(data: SceneBreakdownRequest) {
    return await this.storyboardService.generateSceneBreakdown(data);
  }
}
