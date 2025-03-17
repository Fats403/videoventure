import { OpenAI } from "openai";
import { z } from "zod";

// Define Zod schemas for validation
const SceneSchema = z.object({
  scene_number: z.number().int().positive(),
  visual_description: z.string().min(50).max(512),
  voiceover: z.string().max(650),
});

const StoryboardSchema = z.array(SceneSchema);

const StoryboardResponseSchema = z.object({
  title: z.string(),
  visual_style: z.string(),
  tags: z.array(z.string()).min(3).max(5),
  scenes: z
    .array(SceneSchema)
    .min(2)
    .refine(
      (scenes) => {
        // Check if scene numbers are sequential starting from 1
        const sortedScenes = [...scenes].sort(
          (a, b) => a.scene_number - b.scene_number
        );
        return sortedScenes.every(
          (scene, index) => scene.scene_number === index + 1
        );
      },
      {
        message: "Scene numbers must be sequential starting from 1",
      }
    ),
});

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

export class StoryboardService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate a storyboard from an input concept using OpenAI with Zod validation
   * @param inputConcept - The overall concept for the video
   * @param maxScenes - Maximum number of scenes to generate (default: 5)
   * @returns Object containing scenes array, visual style, and tags
   */
  async generateStoryboard(
    inputConcept: string,
    maxScenes = 5
  ): Promise<StoryboardResult> {
    console.log(`Generating storyboard...`);

    // Calculate the exact number of scenes to request
    const requestedScenes = Math.min(Math.max(2, maxScenes), 5);

    const systemPrompt = `You are an expert video creator and visual storyteller. Your task is to create a compelling visual storyboard for a video based on a concept provided by the user.

GUIDELINES:
1. Create a catchy, engaging title for the video.
2. IMPORTANT: You MUST create EXACTLY ${requestedScenes} scenes - no more, no less. This is a strict requirement.
3. IMPORTANT: Scene numbers MUST start at 1 and be sequential (1, 2, 3, etc.).
4. Select ONE consistent visual style for the entire video.
5. For each scene, create:
   - A well-crafted visual description under 512 characters that will be used for AI video generation
   - A voiceover script (2-4 sentences) that would be spoken during a 6-14 second video clip
6. Also generate 3-5 relevant tags that describe the content and style of the video.

ELEMENTS OF A GREAT VIDEO PROMPT:
- Subject: Clearly define the main focus of each scene
- Context: Establish the setting or environment
- Action: Describe what's happening in the scene
- Style: Maintain a consistent visual aesthetic throughout
- Camera Motion: Specify how the camera moves (e.g., "drone shot panning across", "steady tracking shot")
- Composition: Indicate how the shot is framed
- Ambiance: Convey the mood, lighting, and atmosphere

IMPORTANT TIPS FOR EFFECTIVE VIDEO GENERATION:
- Be specific and detailed about visual elements
- Include camera movements at the beginning of descriptions
- Use positive descriptions rather than negations
- Specify lighting, color palette, and atmosphere
- Keep descriptions under 512 characters
- The concept could be for any type of video: narrative story, advertisement, educational content, etc.

YOUR RESPONSE MUST FOLLOW THIS EXACT JSON STRUCTURE:
{
  "title": "Catchy title for the video",
  "visual_style": "Description of the consistent visual style for all scenes",
  "tags": ["tag1", "tag2", "tag3"],
  "scenes": [
    {
      "scene_number": 1,
      "visual_description": "Detailed visual description for AI video generation, including the visual style",
      "voiceover": "Short voiceover text for this scene",
    },
    ...additional scenes as needed...
  ]
}`;

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
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: `Create a video storyboard with EXACTLY ${requestedScenes} scenes based on this concept: "${inputConcept}". 

If the concept already specifies scenes, you MUST follow that structure but ensure there are EXACTLY ${requestedScenes} scenes total.
If the concept doesn't specify scenes, create a logical narrative with ${requestedScenes} scenes.

Scene numbers MUST start at 1 and be sequential (1, 2, 3, etc.).

Remember to format your response as a JSON object with a "title" string, "visual_style" string, "tags" array, and a "scenes" array containing all scene objects.`,
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

          // Extract the validated scenes array, visual style, and tags
          const validatedStoryboard = validatedStoryboardResponse.scenes;
          const visualStyle = validatedStoryboardResponse.visual_style;
          const tags = validatedStoryboardResponse.tags || [];
          const title = validatedStoryboardResponse.title;

          // Validate with Zod schema
          const validatedScenes = StoryboardSchema.parse(validatedStoryboard);
          console.log(
            `✅ Successfully validated storyboard with ${validatedScenes.length} scenes`
          );

          validatedResponse = {
            scenes: validatedScenes,
            visualStyle: visualStyle,
            tags: tags,
            title: title,
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
}
