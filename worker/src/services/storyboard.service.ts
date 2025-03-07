import { OpenAI } from "openai";
import { z } from "zod";
import * as fs from "fs";

// Define Zod schemas for validation
const SceneSchema = z.object({
  scene_number: z.number().int().positive(),
  visual_description: z.string().min(50).max(512),
  voiceover: z.string().max(500),
});

const StoryboardSchema = z.array(SceneSchema);

const StoryboardResponseSchema = z.object({
  visual_style: z.string().optional(),
  scenes: z.array(SceneSchema),
});

export interface Scene {
  scene_number: number;
  visual_description: string;
  voiceover: string;
}

export interface StoryboardResult {
  scenes: Scene[];
  visualStyle: string;
}

export class StoryboardService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate a storyboard from a story concept using OpenAI with Zod validation
   * @param storyIdea - The overall story concept
   * @param maxScenes - Maximum number of scenes to generate (default: 5)
   * @returns Object containing scenes array and visual style
   */
  async generateStoryboard(
    storyIdea: string,
    maxScenes = 5
  ): Promise<StoryboardResult> {
    console.log(`Generating storyboard...`);

    const systemPrompt = `You are an expert storyboard artist and filmmaker. Your task is to create a compelling visual storyboard for a short video based on a concept provided by the user.

GUIDELINES:
1. Analyze the concept and determine the appropriate number of scenes needed (minimum 2, maximum ${maxScenes}).
2. First, select ONE consistent visual style for the entire video
3. For each scene, create:
   - A visual description under 512 characters that can be used for AI video generation
   - A voiceover script (2-4 sentences) that would be spoken during a 6-15 second video clip
4. Focus on visual storytelling - what the viewer will see, not just plot points
5. Ensure logical progression between scenes to tell a coherent story
6. Determine an appropriate music mood that matches the overall tone of the story
7. If the user gives you something that resembles ascript, then the voice over should resemble what the user has inputted otherwise make up a voice over
8. IMPORTANT: Include the chosen visual style in EVERY scene description to ensure consistency

IMPORTANT RULES FOR VIDEO GENERATION PROMPTS:
- Keep each visual description under 512 characters
- Place camera movement descriptions at the start or end of the prompt (e.g., "Cinematic dolly shot of...", "Camera pans across...")
- NEVER use negation words like "no", "not", "without" - the model doesn't understand negation
- Include technical terms like "4k", "cinematic", "photorealistic", "shallow depth of field" when appropriate
- Be specific about lighting, atmosphere, and visual details

YOUR RESPONSE MUST FOLLOW THIS EXACT JSON STRUCTURE:
{
  "visual_style": "Description of the consistent visual style for all scenes",
  "scenes": [
    {
      "scene_number": 1,
      "visual_description": "Detailed visual description for AI video generation, including the visual style",
      "voiceover": "Short voiceover text for this scene",
    },
    ...additional scenes as needed...
  ],
}

IMPORTANT REQUIREMENTS:
- You MUST include at least ${Math.min(2, maxScenes)} scenes, no exceptions
- scene_number must be a positive integer
- visual_description must be between 50 and 512 characters
- voiceover must be 500 characters or less
- Each visual description must focus on what is visually happening, not backstory
- Descriptions should include details about lighting, camera angles, and movement
- EVERY scene description must explicitly mention the chosen visual style for consistency`;

    try {
      // Make up to 3 attempts to get a valid response
      let attempts = 0;
      const maxAttempts = 3;
      let validatedResponse: StoryboardResult | null = null;
      let lastError: Error | null = null;

      while (attempts < maxAttempts && !validatedResponse) {
        attempts++;
        console.log(`Storyboard generation attempt ${attempts}/${maxAttempts}`);

        try {
          const response = await this.openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: `Create a storyboard with at least ${Math.min(
                  2,
                  maxScenes
                )} scenes for a short video based on this concept: "${storyIdea}". Remember to format your response as a JSON object with a "visual_style" string, a "scenes" array containing all scene objects.`,
              },
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
          });

          // Parse the response
          const content = response.choices?.[0].message.content ?? "";

          let parsedResponse;
          try {
            parsedResponse = JSON.parse(content);
          } catch (parseError: any) {
            throw new Error(
              `Failed to parse JSON response: ${parseError.message}`
            );
          }

          // Validate the entire response structure
          const validatedStoryboardResponse =
            StoryboardResponseSchema.parse(parsedResponse);

          // Extract the validated scenes array and visual style
          const validatedStoryboard = validatedStoryboardResponse.scenes;
          const visualStyle =
            validatedStoryboardResponse.visual_style || "photorealistic";

          if (!validatedStoryboard) {
            throw new Error('Response does not contain a "scenes" array');
          }

          if (!Array.isArray(validatedStoryboard)) {
            throw new Error('The "scenes" property is not an array');
          }

          if (validatedStoryboard.length < Math.min(2, maxScenes)) {
            throw new Error(
              `Not enough scenes. Required: ${Math.min(2, maxScenes)}, Got: ${
                validatedStoryboard.length
              }`
            );
          }

          // Validate with Zod schema
          const validatedScenes = StoryboardSchema.parse(validatedStoryboard);
          console.log(
            `✅ Successfully validated storyboard with ${validatedScenes.length} scenes`
          );

          validatedResponse = {
            scenes: validatedScenes,
            visualStyle: visualStyle,
          };
        } catch (attemptError: any) {
          lastError = attemptError;
          console.warn(`Attempt ${attempts} failed: ${attemptError.message}`);

          // If this is a Zod validation error, log more details
          if (attemptError.name === "ZodError") {
            console.warn("Validation errors detected");
          }

          // Short pause before retry
          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }
      }

      // If we couldn't get a valid response after all attempts
      if (!validatedResponse) {
        throw new Error(
          `Failed to generate valid storyboard after ${maxAttempts} attempts: ${lastError?.message}`
        );
      }

      return validatedResponse;
    } catch (error: any) {
      console.error("❌ Error generating storyboard:", error.message);
      throw error;
    }
  }

  /**
   * Save storyboard to a text file
   * @param storyboard - The storyboard result
   * @param outputPath - Path to save the storyboard text
   */
  saveStoryboardToFile(storyboard: StoryboardResult, outputPath: string): void {
    const storyboardText =
      `Visual Style: ${storyboard.visualStyle}\n\n` +
      storyboard.scenes
        .map(
          (scene) =>
            `Scene ${scene.scene_number}:\n` +
            `Visual: ${scene.visual_description}\n` +
            `Voiceover: "${scene.voiceover}"\n`
        )
        .join("\n\n");

    fs.writeFileSync(outputPath, storyboardText);
    console.log(`✅ Storyboard saved to ${outputPath}`);
  }
}
