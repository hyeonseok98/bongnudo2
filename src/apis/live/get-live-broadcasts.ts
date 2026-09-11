import { z } from "zod";

import type { LiveBroadcast } from "@/features/live/live-stream";

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
});

export async function getLiveBroadcasts(): Promise<LiveBroadcast[]> {
  const response = await fetch("/api/live");

  if (!response.ok) {
    throw new Error("실시간 방송 정보를 불러오지 못함.");
  }

  const result = liveBroadcastResponseSchema.parse(await response.json());

  return result.broadcasts;
}
