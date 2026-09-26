import "server-only";

import { z } from "zod";

import { getR2PublicUrl } from "@/lib/r2";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

import type { ArchiveListItem } from "./archive";
import { ArchiveRequestError } from "./archive-error";

const seasonDaySchema = z.object({
  id: z.uuid(), dayNumber: z.number().int().positive(), sessionDate: z.string().date(),
});
const cardParticipantSchema = z.object({
  id: z.uuid(), rp_name: z.string().nullable(), streamer_name: z.string(),
  rp_image_key: z.string().nullable(), streamer_image_key: z.string().nullable(),
});
const summarySchema = z.object({
  people: z.array(z.object({
    id: z.uuid(), rpName: z.string().nullable(), streamerName: z.string(),
    rpImageKey: z.string().nullable(), streamerImageKey: z.string().nullable(),
    archiveCount: z.number().int().nonnegative(),
  })),
  days: z.array(seasonDaySchema.extend({ archiveCount: z.number().int().nonnegative() })),
  categories: z.array(z.object({
    category: z.enum(["character", "incident", "series", "other"]),
    archiveCount: z.number().int().nonnegative(),
  })),
});

export async function getArchiveDiscoverySummary(seasonId: number) {
  const [result, days] = await Promise.all([
    getSupabaseAdminClient().rpc("get_archive_discovery_summary", { p_season_id: seasonId }),
    getSeasonDayArchiveCounts(seasonId),
  ]);
  const parsed = summarySchema.safeParse(result.data);
  if (result.error || !parsed.success) {
    throw new ArchiveRequestError("아카이브 탐색 정보를 불러오지 못함.", 500, { cause: result.error });
  }

  return {
    ...parsed.data,
    days,
    people: parsed.data.people.map(({ rpImageKey, streamerImageKey, ...person }) => ({
      ...person,
      rpProfileImageUrl: getR2PublicUrl(rpImageKey),
      streamerProfileImageUrl: getR2PublicUrl(streamerImageKey),
    })),
  };
}

async function getSeasonDayArchiveCounts(seasonId: number) {
  const supabase = getSupabaseAdminClient();
  const daysResult = await supabase
    .from("season_days")
    .select("id, day_number, session_date")
    .eq("season_id", seasonId)
    .order("day_number", { ascending: true });

  if (daysResult.error) {
    throw new ArchiveRequestError("운영 일차를 불러오지 못함.", 500, { cause: daysResult.error });
  }

  const dayIds = daysResult.data.map((day) => day.id);
  if (dayIds.length === 0) return [];

  const relationsResult = await supabase
    .from("archive_day_relations")
    .select("archive_id, season_day_id")
    .eq("season_id", seasonId)
    .in("season_day_id", dayIds);

  if (relationsResult.error) {
    throw new ArchiveRequestError("일차별 아카이브를 불러오지 못함.", 500, { cause: relationsResult.error });
  }

  const archiveIds = [...new Set(relationsResult.data.map((relation) => relation.archive_id))];
  if (archiveIds.length === 0) {
    return daysResult.data.map((day) => ({
      archiveCount: 0,
      dayNumber: day.day_number,
      id: day.id,
      sessionDate: day.session_date,
    }));
  }

  const archivesResult = await supabase
    .from("archives")
    .select("id")
    .in("id", archiveIds)
    .eq("season_id", seasonId)
    .eq("visibility", "public")
    .is("deleted_at", null);

  if (archivesResult.error) {
    throw new ArchiveRequestError("공개 아카이브를 불러오지 못함.", 500, { cause: archivesResult.error });
  }

  const publicArchiveIds = new Set(archivesResult.data.map((archive) => archive.id));
  const countByDayId = new Map<string, number>();
  for (const relation of relationsResult.data) {
    if (!publicArchiveIds.has(relation.archive_id)) continue;
    countByDayId.set(relation.season_day_id, (countByDayId.get(relation.season_day_id) ?? 0) + 1);
  }

  return daysResult.data.map((day) => ({
    archiveCount: countByDayId.get(day.id) ?? 0,
    dayNumber: day.day_number,
    id: day.id,
    sessionDate: day.session_date,
  }));
}

export async function getArchiveCardRelations(archiveIds: string[]) {
  const relations = new Map<string, Pick<ArchiveListItem, "relatedParticipants" | "relatedParticipantCount" | "relatedSeasonDays">>();
  if (archiveIds.length === 0) return relations;

  const result = await getSupabaseAdminClient().rpc("get_archive_card_relations", {
    p_archive_ids: [...new Set(archiveIds)],
  });
  if (result.error) {
    throw new ArchiveRequestError("관련 인물과 일차를 불러오지 못함.", 500, { cause: result.error });
  }
  for (const row of result.data) {
    const participants = z.array(cardParticipantSchema).safeParse(row.participants);
    const days = z.array(seasonDaySchema).safeParse(row.season_days);
    if (!participants.success || !days.success) {
      throw new ArchiveRequestError("관련 인물과 일차를 불러오지 못함.", 500);
    }
    relations.set(row.archive_id, {
      relatedParticipantCount: row.participant_count,
      relatedParticipants: participants.data.map((person) => ({
        id: person.id, rpName: person.rp_name, streamerName: person.streamer_name,
        rpProfileImageUrl: getR2PublicUrl(person.rp_image_key),
        streamerProfileImageUrl: getR2PublicUrl(person.streamer_image_key),
      })),
      relatedSeasonDays: days.data,
    });
  }
  return relations;
}
