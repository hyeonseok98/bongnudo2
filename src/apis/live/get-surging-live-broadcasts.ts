import { z } from "zod";

import type { SurgingLiveBroadcast } from "@/features/live/live-stream";

const surgingLiveBroadcastSchema = z.object({
  baselineViewerCount: z.number().int().nonnegative(),
  channelId: z.string().min(1),
  channelName: z.string(),
  concurrentUserCount: z.number().int().nonnegative(),
  liveId: z.number().int(),
  surgeScore: z.number().nonnegative(),
  thumbnailUrl: z.string(),
  title: z.string(),
  viewerDelta: z.number().int().positive(),
  viewerRate: z.number().positive(),
});

const surgingLiveBroadcastResponseSchema = z.object({
  broadcasts: z.array(surgingLiveBroadcastSchema),
  refreshedAt: z.string().datetime({ offset: true }).nullable(),
});

export interface SurgingLiveBroadcastsResponse {
  broadcasts: SurgingLiveBroadcast[];
  refreshedAt: string | null;
}

export async function getSurgingLiveBroadcasts(): Promise<SurgingLiveBroadcastsResponse> {
  const response = await fetch("/api/live/surging");

  if (!response.ok) {
    throw new Error("급상승 LIVE 정보를 불러오지 못함.");
  }

  return surgingLiveBroadcastResponseSchema.parse(await response.json());
}
