import { z } from "zod";

import type { LatestTimelineData } from "@/features/timeline/timeline";

const latestTimelineSchema: z.ZodType<LatestTimelineData> = z.object({
  events: z.array(
    z.object({
      category: z.object({ name: z.string(), slug: z.string() }),
      id: z.string().uuid(),
      occurredAt: z.string().datetime({ offset: true }),
      title: z.string(),
    }),
  ),
});

export async function getLatestTimeline(): Promise<LatestTimelineData> {
  const response = await fetch("/api/timeline/latest");

  if (!response.ok) {
    throw new Error("타임라인을 불러오지 못했습니다.");
  }

  return latestTimelineSchema.parse(await response.json());
}
