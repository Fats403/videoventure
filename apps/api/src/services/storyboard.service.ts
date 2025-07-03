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
  SceneBreakdownRequest,
  SceneBreakdownResponse,
  SceneBreakdownLLMResponseSchema,
  SceneBreakdownLLMResponse,
} from "../schemas/storyboard.schema";
import { nanoid } from "nanoid";
import type { Character, Scene, AspectRatio } from "@video-venture/shared";
import { getFalModel } from "@video-venture/shared";
import { MediaService } from "./media.service";

export class StoryboardService {
  private genAI: GoogleGenerativeAI;
  private modelName: string = "gemini-2.0-flash";
  private maxAttempts = 3;
  private mediaService: MediaService;

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY not set.");
    }
    this.genAI = new GoogleGenerativeAI(key);
    this.mediaService = new MediaService();
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

    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      systemInstruction: systemInstruction,
      generationConfig,
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

  /**
   * Generate scene breakdown from storyboard and settings with actual image generation
   */
  async generateSceneBreakdown(
    breakdownData: SceneBreakdownRequest
  ): Promise<SceneBreakdownResponse> {
    console.log(`🎬 Generating scene breakdown from storyboard`);

    const systemInstruction =
      this.buildSceneBreakdownSystemPrompt(breakdownData);
    const userPrompt = this.buildSceneBreakdownUserPrompt(breakdownData);

    const validatedResponse = await this.callSceneBreakdownGeminiAPI(
      systemInstruction,
      userPrompt
    );

    // Generate actual images for each scene using the new approach
    const scenes: Scene[] = await Promise.all(
      validatedResponse.scenes.map(async (scene, index) => {
        try {
          const sceneImageUrl = await this.generateSceneImage(
            scene.imageDescription,
            breakdownData.characters ?? [],
            index,
            breakdownData.settings.aspectRatio
          );

          return {
            id: nanoid(),
            imageUrl: sceneImageUrl,
            imageDescription: this.enhanceImageDescriptionWithCharacters(
              scene.imageDescription,
              breakdownData.characters ?? []
            ),
            voiceOver: scene.voiceOver,
            duration: scene.duration,
            order: index + 1,
          };
        } catch (error) {
          console.error(
            `❌ Failed to generate image for scene ${index + 1}:`,
            error
          );
          // Fallback to placeholder if image generation fails
          return {
            id: nanoid(),
            imageUrl: this.generatePlaceholderImageUrl(
              scene.imageDescription,
              index
            ),
            imageDescription: this.enhanceImageDescriptionWithCharacters(
              scene.imageDescription,
              breakdownData.characters ?? []
            ),
            voiceOver: scene.voiceOver,
            duration: scene.duration,
            order: index + 1,
          };
        }
      })
    );

    return {
      scenes,
      musicDescription: validatedResponse.musicDescription,
    };
  }

  /**
   * Generate scene image using MediaService directly
   */
  private async generateSceneImage(
    imageDescription: string,
    characters: Character[],
    sceneIndex: number,
    aspectRatio: AspectRatio
  ): Promise<string> {
    console.log(
      `🎨 Generating scene image ${sceneIndex + 1}: ${imageDescription}`
    );
    console.log(`📐 Using aspect ratio: ${aspectRatio}`);

    try {
      // Get characters mentioned in this scene
      const mentionedCharacters = this.getMentionedCharacters(
        imageDescription,
        characters
      );

      console.log(
        `👥 Scene ${sceneIndex + 1} includes ${mentionedCharacters.length} characters`
      );

      // Build the complete prompt for scene generation
      const scenePrompt = this.buildSceneWithCharactersPrompt(
        imageDescription,
        mentionedCharacters
      );

      // Generate scene with character references using MediaService directly
      const sceneImageBuffer =
        await this.mediaService.generateSceneWithCharacters(
          scenePrompt,
          mentionedCharacters,
          aspectRatio
        );

      // Upload to storage using MediaService
      const timestamp = Date.now();
      const storageKey = `scenes/scene-${sceneIndex + 1}-${timestamp}.webp`;

      return await this.mediaService.uploadImage(sceneImageBuffer, storageKey);
    } catch (error) {
      console.error(
        `❌ Scene image generation failed for scene ${sceneIndex + 1}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Build enhanced prompt for scene generation with character context
   * @param sceneDescription - Original scene description
   * @param characters - Array of characters to include
   * @returns Enhanced prompt for image generation
   */
  private buildSceneWithCharactersPrompt(
    sceneDescription: string,
    characters: Character[]
  ): string {
    if (characters.length === 0) {
      return sceneDescription;
    }

    let prompt = `Create a scene based on this description: ${sceneDescription}\n\n`;

    prompt += `Include these characters in the scene:\n`;
    characters.forEach((char, index) => {
      prompt += `${index + 1}. ${char.name}: ${char.description}`;
      if (char.appearance) prompt += ` (Appearance: ${char.appearance})`;
      if (char.age) prompt += ` (Age: ${char.age})`;
      prompt += `\n`;
    });

    prompt += `\nUse the reference images provided to maintain character consistency. `;
    prompt += `Integrate the characters naturally into the scene with appropriate lighting, perspective, and composition. `;
    prompt += `Ensure the characters are positioned and posed according to the scene description. `;
    prompt += `Create a cohesive, cinematic image that tells the story effectively.`;

    return prompt;
  }

  /**
   * Get characters mentioned in the image description
   */
  private getMentionedCharacters(
    imageDescription: string,
    characters: Character[]
  ): Character[] {
    return characters.filter((char) =>
      imageDescription.toLowerCase().includes(char.name.toLowerCase())
    );
  }

  private buildSceneBreakdownSystemPrompt(
    data: SceneBreakdownRequest
  ): Content {
    const videoModel = getFalModel(data.settings.videoModel);
    const maxDuration = Math.max(...videoModel.supportedDurations);
    const minDuration = Math.min(...videoModel.supportedDurations);

    let characterContext = "";
    if (data.characters && data.characters.length > 0) {
      characterContext = `\n\nCHARACTERS AVAILABLE:
${data.characters.map((char) => `- ${char.name}: ${char.description}${char.appearance ? ` (Appearance: ${char.appearance})` : ""}${char.age ? ` (Age: ${char.age})` : ""}`).join("\n")}

When a character appears in a scene, include their name and key visual details in the imageDescription. Be consistent with their appearance throughout all scenes.`;
    }

    const promptText = `You are an expert video producer creating a detailed scene breakdown for video generation.

TASK: Break down the provided storyboard into ${minDuration === maxDuration ? maxDuration : `${minDuration}-${maxDuration}`} second video scenes AND create a cohesive music description.

VIDEO SPECIFICATIONS:
- Aspect Ratio: ${data.settings.aspectRatio}
- Video Model: ${data.settings.videoModel}
- Scene Duration: ${minDuration === maxDuration ? `${maxDuration} seconds each` : `${minDuration}-${maxDuration} seconds each`}
- Style: ${data.settings.videoStyle !== "none" ? data.settings.videoStyle : "Natural/realistic"}
${data.settings.cinematicInspiration ? `- Cinematic Style: ${data.settings.cinematicInspiration}` : ""}${characterContext}

REQUIREMENTS FOR EACH SCENE:
1. imageDescription: Detailed visual description for image generation (2-3 sentences)
   - Include specific visual details, lighting, composition
   - Mention characters by name if they appear
   - Include environment and mood details
   - Make it suitable for AI image generation

2. voiceOver: Natural narration text that will be converted to speech
   - Should flow naturally when spoken aloud
   - Match the duration timing
   - Advance the story meaningfully

3. duration: Scene length in seconds (${minDuration === maxDuration ? maxDuration : `between ${minDuration} and ${maxDuration}`})
   - Consider pacing and content complexity
   - Allow time for visual storytelling

4. order: Sequential scene number starting from 1

MUSIC DESCRIPTION REQUIREMENTS:
Create a comprehensive music description that:
- Complements the overall narrative and emotional arc
- Matches the tone and style of the storyboard
- Considers the cinematic inspiration if provided
- Supports the pacing and flow of all scenes
- Includes specific musical elements (instruments, tempo, mood)

GUIDELINES:
- Create 4-8 scenes total (aim for balanced pacing)
- Each scene should advance the story significantly
- Ensure visual variety between scenes
- Match the tone and style of the original storyboard
- Keep character appearances consistent
- Make scenes cinematic and engaging
- Ensure music description enhances the overall video experience

OUTPUT FORMAT (JSON only, no other text):
{
  "scenes": [
    {
      "imageDescription": "Detailed scene description for image generation",
      "voiceOver": "Natural narration text for this scene",
      "duration": ${maxDuration},
      "order": 1
    }
  ],
  "musicDescription": "Comprehensive description of background music that complements the entire video, including specific musical elements, tempo, mood, and how it supports the narrative flow"
}`;

    return { role: "system", parts: [{ text: promptText }] };
  }

  private buildSceneBreakdownUserPrompt(data: SceneBreakdownRequest): string {
    const selectedStoryboard = data.storyboard.variants.find(
      (v) => v.id === data.storyboard.selectedVariantId
    );

    if (!selectedStoryboard) {
      throw new Error("No selected storyboard variant found");
    }

    let prompt = `Break down this storyboard into scenes:\n\n`;
    prompt += `STORYBOARD TITLE: ${selectedStoryboard.title}\n`;
    prompt += `STORYBOARD CONTENT:\n${selectedStoryboard.content}\n\n`;

    if (data.storyboard.customContent) {
      prompt += `CUSTOM MODIFICATIONS:\n${data.storyboard.customContent}\n\n`;
    }

    prompt += `PROJECT SETTINGS:\n`;
    prompt += `- Project: ${data.settings.projectName}\n`;
    prompt += `- Video Model: ${data.settings.videoModel}\n`;
    prompt += `- Aspect Ratio: ${data.settings.aspectRatio}\n`;
    if (data.settings.videoStyle !== "none") {
      prompt += `- Visual Style: ${data.settings.videoStyle}\n`;
    }
    if (data.settings.cinematicInspiration) {
      prompt += `- Cinematic Inspiration: ${data.settings.cinematicInspiration}\n`;
    }

    if (data.characters && data.characters.length > 0) {
      prompt += `\nCHARACTERS TO INCLUDE:\n`;
      data.characters.forEach((char) => {
        prompt += `- ${char.name}: ${char.description}\n`;
        if (char.appearance) prompt += `  Appearance: ${char.appearance}\n`;
        if (char.age) prompt += `  Age: ${char.age}\n`;
      });
    }

    prompt += `\nCreate a scene breakdown that brings this storyboard to life as a compelling video.`;

    return prompt;
  }

  private enhanceImageDescriptionWithCharacters(
    description: string,
    characters: Character[]
  ): string {
    if (characters.length === 0) return description;

    // Check if any character names are mentioned in the description
    const mentionedCharacters = characters.filter((char) =>
      description.toLowerCase().includes(char.name.toLowerCase())
    );

    if (mentionedCharacters.length === 0) return description;

    // Enhance description with character details
    let enhancedDescription = description;

    mentionedCharacters.forEach((char) => {
      const characterDetails = [];
      if (char.appearance) characterDetails.push(char.appearance);
      if (char.age) characterDetails.push(`age ${char.age}`);

      if (characterDetails.length > 0) {
        const details = characterDetails.join(", ");
        enhancedDescription += ` ${char.name} is shown with ${details}.`;
      }
    });

    return enhancedDescription;
  }

  private generatePlaceholderImageUrl(
    description: string,
    index: number
  ): string {
    // Generate a placeholder image URL - in production, this would be replaced with actual generated images
    const encodedDescription = encodeURIComponent(
      description.substring(0, 100)
    );
    return `https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop&q=80&scene=${index}&desc=${encodedDescription}`;
  }

  private async callSceneBreakdownGeminiAPI(
    systemInstruction: Content,
    userPrompt: string
  ): Promise<SceneBreakdownLLMResponse> {
    const generationConfig: GenerationConfig = {
      temperature: 0.7, // Slightly lower temperature for more consistent scene structure
      responseMimeType: "application/json",
    };

    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      systemInstruction: systemInstruction,
      generationConfig,
    });

    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < this.maxAttempts) {
      attempts++;
      try {
        console.log(`🔄 Scene breakdown attempt ${attempts}...`);

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
          SceneBreakdownLLMResponseSchema.safeParse(parsedResponse);

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

        console.log(
          `✅ Attempt ${attempts} - Successfully generated scene breakdown with ${validationResult.data.scenes.length} scenes`
        );
        return validationResult.data;
      } catch (error: any) {
        lastError = error;
        console.warn(
          `🔄 Scene breakdown attempt ${attempts} failed:`,
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
      new Error("Failed to generate valid scene breakdown after all attempts")
    );
  }
}
