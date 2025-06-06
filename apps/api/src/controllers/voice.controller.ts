import { VoiceService } from "../services/voice.service";
import { GetVoicesRequest } from "../schemas/voice.schema";

export class VoiceController {
  private voiceService: VoiceService;

  constructor(voiceService: VoiceService) {
    this.voiceService = voiceService;
  }

  async getVoices(params: GetVoicesRequest) {
    return await this.voiceService.getVoices(params.pageSize);
  }
}
