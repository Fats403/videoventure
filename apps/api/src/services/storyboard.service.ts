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
  private modelName: string = "gemini-2.0-flash";
  private maxAttempts = 3;

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY not set.");
    }
    this.genAI = new GoogleGenerativeAI(key);
  }

  private buildSystemPrompt(variantCount: number = 2, format: string): Content {
    if (format === "commercial") {
      return this.buildCommercialPrompt(variantCount);
    } else {
      return this.buildNarrativePrompt(variantCount);
    }
  }

  private buildNarrativePrompt(variantCount: number = 2): Content {
    const promptText = `You are an expert storyteller creating detailed narrative storyboards. Generate ${variantCount} distinct story approaches written as engaging short stories.

TASK: Create ${variantCount} detailed narrative storyboards (max 3000 characters each).

REQUIREMENTS:
- Write as engaging short stories with flowing paragraphs
- Include rich character development and narrative progression
- Use descriptive language that paints clear visual pictures
- Show character transformation and emotional journey
- Write in third person narrative style
- Flow naturally from one story beat to the next
- Include character thoughts, emotions, and motivations
- Show character development throughout the story

STORY STRUCTURE:
- Natural character introductions within the narrative flow
- Clear beginning, middle, and end progression
- Conflict, development, and resolution
- Emotional depth and engaging prose

OUTPUT FORMAT (JSON only, no other text):
[
  {
    "title": "Compelling Creative Title",
    "description": "Brief 2-3 sentence overview of this narrative approach",
    "tags": ["relevant", "story", "keywords"],
    "content": "[Write the complete story in flowing paragraphs, like a short story. Make it engaging and visual while maintaining narrative flow.]"
  }
]

Write compelling, readable stories that feel like complete short narratives with well-developed characters and clear story arcs.`;

    return { role: "system", parts: [{ text: promptText }] };
  }

  private buildCommercialPrompt(variantCount: number = 2): Content {
    const promptText = `You are an expert commercial storyboard artist creating advertising concepts. Generate ${variantCount} distinct commercial approaches.

TASK: Create ${variantCount} detailed commercial storyboards (max 3000 characters each).

REQUIREMENTS:
- Structure as actual commercial storyboard outlines
- Focus on advertising objectives and brand messaging
- Include hook, problem/solution, product benefits, and call-to-action
- Show how to engage target audience and drive action
- Write in paragraph form, NOT numbered sections or bullet points
- Flow naturally from one advertising beat to the next

COMMERCIAL STRUCTURE (write as flowing paragraphs):
- Opening Hook: How to grab attention immediately
- Problem/Situation: What challenge or need does the audience face
- Solution Introduction: How the product/service addresses this
- Demonstration/Benefits: Show the product in action or key benefits
- Emotional Connection: Why this matters to the target audience
- Call-to-Action: Clear next step for the viewer

OUTPUT FORMAT (JSON only, no other text):
[
  {
    "title": "Compelling Creative Title",
    "description": "Brief 2-3 sentence overview of this commercial approach",
    "tags": ["relevant", "advertising", "keywords"],
    "content": "[Write the commercial storyboard as flowing paragraphs that describe the advertising approach, visual elements, and messaging strategy.]"
  }
]

Write commercial storyboards as descriptive paragraphs that explain the advertising strategy and visual approach, not as numbered lists or sections.`;

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

    const systemInstruction = this.buildSystemPrompt(2, conceptData.format);
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

    const systemInstruction = this.buildSystemPrompt(1, conceptData.format);

    let additionalInstructions = "";
    if (conceptData.format === "commercial") {
      additionalInstructions = `\n\nFor this additional variant, explore a different advertising approach:
- Try a different emotional appeal or marketing angle
- Consider alternative ways to present the product benefits
- Explore different target audience connection points
- Write in flowing paragraphs, not numbered sections`;
    } else {
      additionalInstructions = `\n\nFor this additional variant, explore a different storytelling approach:
- Consider telling from a different character's perspective
- Try a different emotional tone or narrative structure
- Explore alternative character relationships or story arcs
- Maintain the engaging short story format`;
    }

    const userPrompt =
      this.buildUserPrompt(conceptData) + additionalInstructions;

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
    let prompt = `Create detailed storyboard content for this concept:\n\n`;

    prompt += `CONCEPT: ${conceptData.content}\n`;
    prompt += `FORMAT: ${conceptData.format}\n`;

    if (conceptData.genre) prompt += `GENRE: ${conceptData.genre}\n`;
    if (conceptData.tone) prompt += `TONE: ${conceptData.tone}\n`;

    // Only add commercial-specific details for commercial format
    if (conceptData.format === "commercial") {
      prompt += `\nCOMMERCIAL DETAILS:\n`;
      if (conceptData.commercialBrand)
        prompt += `- Brand: ${conceptData.commercialBrand}\n`;
      if (conceptData.commercialMessage)
        prompt += `- Key Message: ${conceptData.commercialMessage}\n`;
      if (conceptData.commercialTargetAudience)
        prompt += `- Target Audience: ${conceptData.commercialTargetAudience}\n`;
      if (conceptData.commercialCallToAction)
        prompt += `- Call to Action: ${conceptData.commercialCallToAction}\n`;

      prompt += `\nCreate a commercial storyboard that effectively advertises this product/service. Write in flowing paragraphs that describe the visual approach and advertising strategy.`;
    } else {
      prompt += `\nCreate this as an engaging short story with flowing paragraphs. Include rich character development, clear narrative progression, and vivid descriptions.`;
    }

    return prompt;
  }
}
