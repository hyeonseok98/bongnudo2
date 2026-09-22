import { z } from "zod";

export interface SetCollectedMediaExclusionInput {
  excluded: boolean;
  mediaId: string;
  mediaType: "clip" | "replay";
}

export async function setCollectedMediaExclusion(
  input: SetCollectedMediaExclusionInput,
): Promise<void> {
  const response = await fetch(`/api/${input.mediaType}s/${input.mediaId}/exclusion`, {
    body: JSON.stringify({ excluded: input.excluded }),
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  });

  if (!response.ok) {
    const result = z.object({ message: z.string() }).safeParse(
      await response.json().catch(() => null),
    );

    throw new Error(result.success ? result.data.message : "영상을 제외하지 못했습니다.");
  }
}
