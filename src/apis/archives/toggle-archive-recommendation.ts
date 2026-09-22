import { z } from "zod";

import type { ArchiveRecommendationResult } from "@/features/archives/archive-recommendation-client";

const archiveRecommendationResultSchema = z.object({
  recommendationCount: z.number().int().nonnegative(),
  recommended: z.boolean(),
});

export async function toggleArchiveRecommendation(
  archiveId: string,
): Promise<ArchiveRecommendationResult> {
  const response = await fetch(`/api/archives/${archiveId}/recommendation`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("추천 처리에 실패했습니다.");
  }

  const result = archiveRecommendationResultSchema.safeParse(await response.json());

  if (!result.success) {
    throw new Error("추천 처리에 실패했습니다.");
  }

  return result.data;
}
