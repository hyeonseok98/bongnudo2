import { z } from "zod";

import type { LiveBroadcastsResponse } from "@/features/live/live-stream";

const liveBroadcastSchema = z.object({
  liveId: z.number().int(),
  title: z.string(),
  thumbnailUrl: z.string(),
  concurrentUserCount: z.number().int().nonnegative(),
  channelId: z.string().min(1),
  channelName: z.string(),
});

const liveBroadcastResponseSchema = z.object({
  broadcasts: z.array(liveBroadcastSchema),
  refreshedAt: z.string().datetime().nullable(),
});

export async function getLiveBroadcasts(): Promise<LiveBroadcastsResponse> {
  const response = await fetch("/api/live");

  if (!response.ok) {
    throw new Error("실시간 방송 정보를 불러오지 못함.");
  }

  return liveBroadcastResponseSchema.parse(await response.json());
}
