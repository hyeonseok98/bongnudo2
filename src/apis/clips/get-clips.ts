import { z } from "zod";

import { serializeClipCursor } from "@/features/clips/clip-cursor";
import type {
  ClipListFilters,
  ClipOptions,
  ClipPage,
} from "@/features/clips/clip";

const clipCursorSchema = z.object({
  clipCreatedAt: z.string().datetime({ offset: true }),
  id: z.uuid(),
});

const clipPageSchema = z.object({
  items: z.array(
    z.object({
      clipCreatedAt: z.string().datetime({ offset: true }),
      clipUrl: z.string().url(),
      durationSeconds: z.number().int().nonnegative().nullable(),
      historicalAffiliations: z.array(
        z.object({
          organizationName: z.string(),
          organizationSlug: z.string(),
          role: z.string().nullable(),
        }),
      ),
      id: z.uuid(),
      participant: z
        .object({
          id: z.uuid(),
          profileImageUrl: z.string().url().nullable(),
          rpName: z.string().nullable(),
          streamerName: z.string(),
        })
        .nullable(),
      seasonDay: z
        .object({
          dayNumber: z.number().int().positive(),
          id: z.uuid(),
          sessionDate: z.string().date(),
        })
        .nullable(),
      thumbnailUrl: z.string().url().nullable(),
      title: z.string(),
      viewCount: z.number().int().nonnegative().nullable(),
    }),
  ),
  nextCursor: clipCursorSchema.nullable(),
});

const clipOptionsSchema = z.object({
  seasonDays: z.array(
    z.object({
      dayNumber: z.number().int().positive(),
      id: z.uuid(),
      sessionDate: z.string().date(),
    }),
  ),
});

export async function getClips(
  filters: ClipListFilters,
  cursor: ClipPage["nextCursor"],
): Promise<ClipPage> {
  const searchParams = new URLSearchParams();

  if (filters.query) searchParams.set("q", filters.query);
  if (filters.groups.length > 0) searchParams.set("groups", filters.groups.join(","));
  if (filters.jobs.length > 0) searchParams.set("jobs", filters.jobs.join(","));
  if (filters.participantIds.length > 0) searchParams.set("participant", filters.participantIds.join(","));
  if (filters.day !== null) searchParams.set("day", String(filters.day));
  if (filters.date !== null) searchParams.set("date", filters.date);
  if (filters.sort !== "latest") searchParams.set("sort", filters.sort);
  if (cursor) searchParams.set("cursor", serializeClipCursor(cursor));

  const query = searchParams.toString();
  const response = await fetch(`/api/clips${query ? `?${query}` : ""}`);

  if (!response.ok) {
    throw new Error("클립을 불러오지 못함.");
  }

  return clipPageSchema.parse(await response.json());
}

export async function getClipOptions(): Promise<ClipOptions> {
  const response = await fetch("/api/clips/options");

  if (!response.ok) {
    throw new Error("클립 필터 정보를 불러오지 못함.");
  }

  return clipOptionsSchema.parse(await response.json());
}
