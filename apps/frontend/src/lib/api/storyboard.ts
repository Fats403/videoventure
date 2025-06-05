import { env } from "@/env";
import type { ConceptData, Storyboard } from "@video-venture/shared";

export async function generateStoryboardVariants(
  token: string | null,
  request: ConceptData,
): Promise<Storyboard[]> {
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

    const data = (await response.json()) as Storyboard[];
    return data;
  } catch (error) {
    console.error("Failed to generate storyboard", error);
    throw new Error("Failed to generate storyboard");
  }
}
