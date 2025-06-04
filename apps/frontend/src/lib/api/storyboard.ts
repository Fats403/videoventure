import { env } from "@/env";
import type { ConceptData, StoryboardVariant } from "@/lib/zod/database";

export async function generateStoryboardVariants(
  token: string | null,
  request: ConceptData,
): Promise<StoryboardVariant[]> {
  try {
    const response = await fetch(
      `${env.NEXT_PUBLIC_SERVER_API_URL}/storyboard/variants`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      },
    );

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`,
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = (await response.json()) as StoryboardVariant[];
    return data;
  } catch (error) {
    console.error("Failed to generate storyboard variants:", error);
    throw new Error("Failed to generate storyboard variants");
  }
}
