import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerationConfig,
  SafetySetting,
  Content,
} from "@google/generative-ai";
import {
  StoryboardRequest,
  StoryboardResponse,
  StoryboardLLMResponseSchema,
  StoryboardLLMResponse,
} from "../schemas/storyboard.schema";

export class StoryboardService {
  private genAI: GoogleGenerativeAI;
  private modelName: string = "gemini-1.5-flash";
  private maxAttempts = 3;

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY not set.");
    }
    this.genAI = new GoogleGenerativeAI(key);
  }

  private buildSystemPrompt(variantCount: number = 2): Content {
    const promptText = `You are an expert video storyteller. Create ${variantCount} different high-level storyboard variants for the given concept.

TASK: Generate ${variantCount} distinct creative approaches to the same concept.

REQUIREMENTS:
1. Each variant should have a different creative angle or storytelling approach
2. Keep descriptions concise but compelling (2-3 sentences max)
3. Content should be a brief outline of the story flow, not detailed scenes
4. Tags should be 3-5 relevant keywords
5. Titles should be catchy and distinct
6. For commercials, ensure each variant incorporates the brand message and call-to-action naturally

OUTPUT FORMAT (JSON only, no other text):
[
  {
    "title": "Creative Title 1",
    "description": "Brief description of this approach",
    "tags": ["tag1", "tag2", "tag3"],
    "content": "High-level story outline: Opening -> Development -> Conclusion"
  },
  // ... ${variantCount} total variants
]`;
    return { role: "system", parts: [{ text: promptText }] };
  }

  private async callGeminiAPI(
    systemInstruction: Content,
    userPrompt: string
  ): Promise<StoryboardLLMResponse> {
    const generationConfig: GenerationConfig = {
      temperature: 0.8,
      responseMimeType: "application/json",
    };

    const safetySettings: SafetySetting[] = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];

    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      systemInstruction: systemInstruction,
      generationConfig,
      safetySettings,
    });

    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < this.maxAttempts) {
      attempts++;
      try {
        // Get the raw response
        const result = await model.generateContent(userPrompt);
        const responseText = result.response.text();

        // Parse JSON
        let parsedResponse;
        try {
          parsedResponse = JSON.parse(responseText);
        } catch (jsonError) {
          throw new Error(
            `Invalid JSON response: ${jsonError instanceof Error ? jsonError.message : "Unknown JSON error"}`
          );
        }

        // Validate schema
        const validationResult =
          StoryboardLLMResponseSchema.safeParse(parsedResponse);

        if (!validationResult.success) {
          console.warn(
            `🔄 Attempt ${attempts} - Schema validation failed:`,
            validationResult.error.message
          );
          console.warn(`📄 Response that failed validation:`, parsedResponse);
          throw new Error(
            `Schema validation failed: ${validationResult.error.message}`
          );
        }

        // Success! Return the validated data
        console.log(
          `✅ Attempt ${attempts} - Successfully generated and validated response`
        );
        return validationResult.data;
      } catch (error: any) {
        lastError = error;
        console.warn(
          `🔄 Gemini API attempt ${attempts} failed:`,
          error.message
        );

        if (attempts < this.maxAttempts) {
          console.log(`⏳ Retrying in ${1000 * attempts}ms...`);
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
        }
      }
    }

    throw (
      lastError ??
      new Error(
        "Failed to generate valid storyboard variants after all attempts"
      )
    );
  }

  /**
   * Generate initial storyboard variants (2 by default)
   */
  async generateInitialVariants(
    conceptData: StoryboardRequest
  ): Promise<StoryboardResponse[]> {
    console.log(`🚀 Generating initial storyboard variants for concept`);

    const systemInstruction = this.buildSystemPrompt(2);
    const userPrompt = this.buildUserPrompt(conceptData);

    const validatedVariants = await this.callGeminiAPI(
      systemInstruction,
      userPrompt
    );

    // Add unique IDs to variants
    return validatedVariants.map((variant, index) => ({
      ...variant,
      id: `variant-${Date.now()}-${index}`,
    }));
  }

  /**
   * Generate one additional variant (for "Generate More" button)
   */
  async generateAdditionalVariant(
    conceptData: StoryboardRequest
  ): Promise<StoryboardResponse> {
    console.log(`🚀 Generating additional storyboard variant`);

    const systemInstruction = this.buildSystemPrompt(1);
    const userPrompt =
      this.buildUserPrompt(conceptData) +
      "\n\nCreate a unique variant that offers a fresh perspective different from typical approaches.";

    const validatedVariants = await this.callGeminiAPI(
      systemInstruction,
      userPrompt
    );

    const variant = validatedVariants[0];
    if (!variant) {
      throw new Error("No variant generated");
    }

    return {
      ...variant,
      id: `variant-${Date.now()}`,
    };
  }

  private buildUserPrompt(conceptData: any): string {
    let prompt = `Create storyboard variants for this concept:\n\n`;

    prompt += `Content: ${conceptData.content}\n`;
    prompt += `Format: ${conceptData.format}\n`;

    if (conceptData.genre) prompt += `Genre: ${conceptData.genre}\n`;
    if (conceptData.tone) prompt += `Tone: ${conceptData.tone}\n`;

    // Add format-specific context
    if (conceptData.format === "commercial") {
      if (conceptData.commercialBrand)
        prompt += `Brand: ${conceptData.commercialBrand}\n`;
      if (conceptData.commercialMessage)
        prompt += `Message: ${conceptData.commercialMessage}\n`;
      if (conceptData.commercialTargetAudience)
        prompt += `Target Audience: ${conceptData.commercialTargetAudience}\n`;
      if (conceptData.commercialCallToAction)
        prompt += `Call to Action: ${conceptData.commercialCallToAction}\n`;
    }

    return prompt;
  }
}
