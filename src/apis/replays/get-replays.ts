import { z } from "zod";

import { serializeReplayCursor } from "@/features/replays/replay-cursor";
import type { ReplayListFilters, ReplayOptions, ReplayPage } from "@/features/replays/replay";

const replayCursorSchema = z.object({
  id: z.uuid(),
  sortAt: z.string().datetime({ offset: true }).nullable(),
});

const replayPageSchema = z.object({
  items: z.array(
    z.object({
      durationSeconds: z.number().int().nonnegative().nullable(),
      historicalAffiliations: z.array(z.object({
        organizationName: z.string(),
        organizationSlug: z.string(),
        role: z.string().nullable(),
      })),
      id: z.uuid(),
      liveStartedAt: z.string().datetime({ offset: true }).nullable(),
      participant: z.object({
        id: z.uuid(),
        profileImageUrl: z.string().url().nullable(),
        rpName: z.string().nullable(),
        streamerName: z.string(),
      }).nullable(),
      publishedAt: z.string().datetime({ offset: true }).nullable(),
      replayUrl: z.string().url(),
      seasonDay: z.object({
        dayNumber: z.number().int().positive(),
        id: z.uuid(),
        sessionDate: z.string().date(),
      }).nullable(),
      thumbnailUrl: z.string().url().nullable(),
      title: z.string(),
      viewCount: z.number().int().nonnegative().nullable(),
    }),
  ),
  nextCursor: replayCursorSchema.nullable(),
});

const replayOptionsSchema = z.object({
  seasonDays: z.array(z.object({
    dayNumber: z.number().int().positive(),
    id: z.uuid(),
    sessionDate: z.string().date(),
  })),
});

export async function getReplays(
  filters: ReplayListFilters,
  cursor: ReplayPage["nextCursor"],
): Promise<ReplayPage> {
  const searchParams = new URLSearchParams();

  if (filters.query) searchParams.set("q", filters.query);
  if (filters.groups.length > 0) searchParams.set("groups", filters.groups.join(","));
  if (filters.jobs.length > 0) searchParams.set("jobs", filters.jobs.join(","));
  if (filters.participantIds.length > 0) searchParams.set("participant", filters.participantIds.join(","));
  if (filters.day !== null) searchParams.set("day", String(filters.day));
  if (filters.date !== null) searchParams.set("date", filters.date);
  if (cursor) searchParams.set("cursor", serializeReplayCursor(cursor));

  const query = searchParams.toString();
  const response = await fetch(`/api/replays${query ? `?${query}` : ""}`);

  if (!response.ok) throw new Error("다시보기를 불러오지 못함.");

  return replayPageSchema.parse(await response.json());
}

export async function getReplayOptions(): Promise<ReplayOptions> {
  const response = await fetch("/api/replays/options");

  if (!response.ok) throw new Error("다시보기 필터 정보를 불러오지 못함.");

  return replayOptionsSchema.parse(await response.json());
}
