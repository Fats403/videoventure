import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerationConfig,
  SafetySetting,
  Content,
} from "@google/generative-ai";
import { z } from "zod";
import { StoryboardResult } from "@video-venture/shared";
import { StoryboardSchema } from "../schemas/video.schema";

// --- Configuration ---
const TARGET_SCENE_DURATION_MIN_SECONDS = 5;
const TARGET_SCENE_DURATION_MAX_SECONDS = 8;
const INTERNAL_MAX_SCENES = 12; // Hard limit for scene count
const DEFAULT_MIN_SCENES = 3; // Recommended min when AI chooses
const DEFAULT_MAX_SCENES_AI = 8; // Recommended max when AI chooses

// --- Storyboard Service using Google Gemini ---
export class StoryboardService {
  private genAI: GoogleGenerativeAI;
  private modelName: string = "gemini-2.0-flash";
  private maxAttempts = 3;
  private internalMaxScenes = INTERNAL_MAX_SCENES;

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY not set.");
    }
    this.genAI = new GoogleGenerativeAI(key);
  }

  // --- Helper: Build System Prompt (AI handles scene count interpretation) ---
  private buildSystemPrompt(includeHook: boolean): Content {
    const hookGuidance = includeHook
      ? `
HOOK SCENE GUIDANCE (Scene 1):
*   **Mandatory Hook:** Scene 1 MUST be an attention-grabbing hook.
*   **Relevance:** Hook must clearly relate to the overall concept.
`
      : "";

    // Simplified timing guidance
    const timingGuidance = `*   **Clip Duration:** Each scene represents a ~${TARGET_SCENE_DURATION_MIN_SECONDS}-${TARGET_SCENE_DURATION_MAX_SECONDS}s video clip. Write voiceover as 1-3 concise sentences speakable in this time. Match visual complexity to this duration.`;

    // Updated Scene Count Instruction for AI interpretation
    const sceneCountInstruction = `Analyze the user's input concept. Check if it requests a specific number of scenes (e.g., 'in 5 scenes', 'make 4 parts').
*   If a specific count is requested: Generate EXACTLY that number of scenes, BUT DO NOT EXCEED the absolute maximum of ${this.internalMaxScenes} scenes.
*   If no specific count is requested: Determine the optimal number of scenes (typically ${DEFAULT_MIN_SCENES}-${DEFAULT_MAX_SCENES_AI}, maximum ${this.internalMaxScenes}) needed to effectively tell the story based on the concept's scope and complexity. Then, generate exactly that number of scenes.
Always ensure at least 2 scenes are generated.`;

    const musicGuidance = `
7.  **Music Description:** Based on the overall concept and scenes, create a detailed 'music_description' (under 256 chars) suitable for a text-to-music AI. Specify:
    *   **Musical Parameters:** Instruments, tempo (BPM if appropriate), mood (e.g., upbeat, suspenseful, chill), genre (e.g., cinematic, hip-hop, ambient).
    *   **Functional Intent:** Describe the music's role (e.g., background for tutorial, energetic intro, emotional underscore).
    *   **Example:** "Uplifting and inspiring cinematic track with orchestral strings, piano melody, and subtle percussion. Builds anticipation. Tempo: 120 BPM. For a product launch video background."
`;

    const enhancedGuidance = `
GUIDANCE FOR EXCELLENCE:
1.  **Visual Storytelling:** Use composition, lighting, color, sensory details.
2.  **Camera Work:** Specify camera movement clearly.
3.  **Clarity & Detail:** Specific but concise for AI.
4.  **Consistency:** 'visual_style' must apply to all descriptions.
5.  **Voiceover Craft:** Concise (1-3 sentences), complements visual, matches tone. ${timingGuidance}
6.  **Tags:** 3-5 relevant tags.
${musicGuidance}
`;

    const promptText = `You are an expert video creator and visual storyteller specializing in AI video storyboards. Generate a compelling storyboard formatted precisely as JSON.

TASK: Create a complete video storyboard based on the user's concept.

CORE REQUIREMENTS:
1.  **Title:** Catchy, engaging title.
2.  **Scene Count:** ${sceneCountInstruction}
3.  **Scene Numbering:** Sequential starting from 1.
4.  **Music Description:** Generate a detailed 'musicDescription' following the guidance.
5.  **Scene Content:** For EACH scene:
    *   'description': Detailed (under 512 chars), with subject, context, action, style, camera, composition, ambiance. Action suitable for ${TARGET_SCENE_DURATION_MIN_SECONDS}-${TARGET_SCENE_DURATION_MAX_SECONDS}s.
    *   'voiceover': Concise script (1-3 sentences) speakable in ${TARGET_SCENE_DURATION_MIN_SECONDS}-${TARGET_SCENE_DURATION_MAX_SECONDS}s.
6.  **Tags:** 3-5 relevant tags.
${hookGuidance}
${enhancedGuidance}
OUTPUT FORMAT:
*   Output ONLY a single, valid JSON object matching the structure below.
*   No introductory text, explanations, or markdown formatting.
{
  "title": "string",
  "tags": ["string", ...],
  "musicDescription": "string",
  "scenes": [
    { "sceneNumber": 1, "description": "string", "voiceover": "string" },
    // ... up to the determined/requested number of scenes (max ${this.internalMaxScenes})
    { "sceneNumber": N, "description": "string", "voiceover": "string" }
  ]
}`;

    return { role: "system", parts: [{ text: promptText }] };
  }

  // --- Helper: Call Gemini API with Retry ---
  private async callGeminiAPI(
    systemInstruction: Content,
    userPrompt: string
  ): Promise<any> {
    const generationConfig: GenerationConfig = {
      temperature: 0.7,
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
      console.log(`✨ Gemini API call attempt ${attempts}/${this.maxAttempts}`);
      try {
        const result = await model.generateContent(userPrompt);
        const responseText = result.response.text();
        try {
          const parsedJson = JSON.parse(responseText);
          console.log(
            `✅ Gemini response parsed successfully (Attempt ${attempts})`
          );
          return parsedJson;
        } catch (parseError: any) {
          console.error("Raw response failed parsing:", responseText);
          lastError = new Error(
            `Failed to parse JSON response: ${parseError.message}`
          );
        }
      } catch (apiError: any) {
        lastError = apiError;
        console.warn(
          `⚠️ Gemini API call failed (Attempt ${attempts}): ${apiError.message}`
        );
        if (apiError.response?.promptFeedback) {
          console.warn(
            "Gemini prompt feedback:",
            apiError.response.promptFeedback
          );
        }
      }
      if (attempts < this.maxAttempts) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1500 + attempts * 500)
        );
      }
    }
    console.error(
      `❌ Failed to get valid JSON response after ${this.maxAttempts} attempts.`
    );
    throw (
      lastError ?? new Error("Unknown error during Gemini API interaction.")
    );
  }

  /**
   * Generate a storyboard from a concept, including a music description.
   * @param inputConcept - The overall concept, potentially including a scene count request like "in 5 scenes".
   * @param includeHook - Whether to make the first scene a hook.
   * @returns StoryboardResult object.
   */
  async generateStoryboard(
    inputConcept: string,
    includeHook = true
  ): Promise<StoryboardResult> {
    console.log(`🚀 Generating storyboard for concept: "${inputConcept}"`);
    console.log(
      `📋 AI will determine scene count based on input (max ${this.internalMaxScenes}).`
    );
    console.log("🎶 AI will also generate a music description.");

    // The system prompt now handles interpreting the scene count request
    const systemInstruction = this.buildSystemPrompt(includeHook);

    // The user prompt simply provides the concept for the AI to analyze
    const userPrompt = `Create a video storyboard based on this concept: "${inputConcept}". Follow all system prompt instructions precisely, including determining the appropriate number of scenes.`;

    let lastValidationError: Error | null = null;
    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        const parsedResponse = await this.callGeminiAPI(
          systemInstruction,
          userPrompt
        );

        // Validate the response structure AND scene count limits
        const validationResult = StoryboardSchema.safeParse(parsedResponse);

        if (!validationResult.success) {
          lastValidationError = new z.ZodError(validationResult.error.issues);
          console.warn(
            `⚠️ Zod validation failed (Attempt ${attempt}):`,
            validationResult.error.format()
          );
          if (attempt < this.maxAttempts) {
            console.log("Retrying after validation failure...");
            await new Promise((resolve) => setTimeout(resolve, 1000));
            continue;
          } else {
            throw lastValidationError;
          }
        }

        const validatedData = validationResult.data;

        // Final check (belt-and-suspenders) in case AI ignored the max limit prompt instruction
        if (validatedData.scenes.length > this.internalMaxScenes) {
          console.warn(
            `⚠️ AI generated ${validatedData.scenes.length} scenes, exceeding internal limit of ${this.internalMaxScenes}. Truncating.`
          );
          validatedData.scenes = validatedData.scenes.slice(
            0,
            this.internalMaxScenes
          );
          // Ensure numbering is still sequential after potential truncation (though slice should maintain it)
          validatedData.scenes.forEach((scene, index) => {
            scene.sceneNumber = index + 1;
          });
        }

        console.log(
          `✅ Successfully validated storyboard with ${validatedData.scenes.length} scenes and music description.`
        );
        return {
          title: validatedData.title,
          tags: validatedData.tags,
          musicDescription: validatedData.musicDescription,
          scenes: validatedData.scenes,
        };
      } catch (error) {
        console.error(
          `❌ Error during storyboard generation (Attempt ${attempt}):`,
          error
        );
        if (attempt >= this.maxAttempts) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }
    throw new Error(
      `Failed to generate storyboard after ${this.maxAttempts} attempts.`
    );
  }
}
