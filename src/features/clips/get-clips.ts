import "server-only";

import type { QueryData, SupabaseClient } from "@supabase/supabase-js";

import {
  getCharacterStateAt,
  type CharacterCareerEvent,
  type CharacterCareerEventType,
} from "@/features/characters/character-career";
import { getCurrentUser, type AuthenticatedUser } from "@/features/auth/session";
import {
  type ClipCursor,
  type ClipItem,
  type ClipListFilters,
  type ClipOptions,
  type ClipPage,
} from "@/features/clips/clip";
import { getR2PublicUrl } from "@/lib/r2";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { getKstDateRange, getKstDateRangeBetween } from "@/features/seasons/season-date";
import { matchesKoreanSearch } from "@/utils/korean-search";

const PAGE_SIZE = 24;

function createActiveSeasonQuery(client: SupabaseClient<Database>) {
  return client.from("seasons").select("id").eq("is_active", true).limit(2);
}

function createParticipantCandidatesQuery(client: SupabaseClient<Database>) {
  return client.from("season_participants").select(`
    id,
    rp_name,
    streamer:streamers!inner (
      name,
      affiliation_memberships:streamer_affiliation_memberships (
        affiliation:streamer_affiliations!inner (
          id,
          slug,
          parent_affiliation_id
        )
      )
    )
  `);
}

function createClipRowsQuery(
  client: SupabaseClient<Database>,
  shouldFilterByTags = false,
) {
  return client.from("clips").select(`
    id,
    title,
    thumbnail_url,
    clip_url,
    duration_seconds,
    view_count,
    clip_created_at,
    season_id,
    season_participant_id,
    participant:season_participants!clips_participant_same_season_fkey (
      id,
      rp_name,
      portrait_image_key,
      streamer:streamers!inner (
        name
      )
    ),
    season_day:season_days!clips_season_day_same_season_fkey (
      id,
      day_number,
      session_date
    ),
    clip_tags${shouldFilterByTags ? "!inner" : ""} (
      created_by,
      tag:tags!inner (
        id,
        name
      )
    )
  `);
}

function createCareerEventsQuery(client: SupabaseClient<Database>) {
  return client.from("character_career_events").select(`
    id,
    participant_id,
    event_type,
    from_role,
    to_role,
    event_date,
    event_at,
    sequence_in_day,
    season_day_id,
    note,
    source_url,
    from_organization:organizations!character_career_events_from_organization_same_season_fkey (
      id,
      slug,
      name,
      type
    ),
    to_organization:organizations!character_career_events_to_organization_same_season_fkey (
      id,
      slug,
      name,
      type
    )
  `);
}

type ClipSourceRow = QueryData<ReturnType<typeof createClipRowsQuery>>[number];
type CareerEventRow = QueryData<ReturnType<typeof createCareerEventsQuery>>[number];

interface CareerEventsByParticipant {
  categoriesByOrganizationId: Map<string, string | null>;
  events: CharacterCareerEvent[];
}

export async function getClipOptions(): Promise<ClipOptions> {
  const client = getSupabaseServerClient();
  const seasonId = await getActiveSeasonId(client);
  const { data, error } = await client
    .from("season_days")
    .select("id, day_number, session_date")
    .eq("season_id", seasonId)
    .order("day_number", { ascending: true });

  if (error) {
    throw new Error("봉누도 일차를 불러오지 못함.", { cause: error });
  }

  return {
    seasonDays: data.map((seasonDay) => ({
      dayNumber: seasonDay.day_number,
      id: seasonDay.id,
      sessionDate: seasonDay.session_date,
    })),
  };
}

export async function getClipPage(
  filters: ClipListFilters,
  cursor: ClipCursor | null,
): Promise<ClipPage> {
  const client = getSupabaseServerClient();
  const viewerPromise = getCurrentUser();
  const participantIds = await resolveClipParticipantIds(client, filters);

  if (participantIds?.length === 0) {
    return { items: [], nextCursor: null };
  }

  const dateRange = filters.date
    ? getKstDateRange(filters.date)
    : filters.dateFrom && filters.dateTo
      ? getKstDateRangeBetween(filters.dateFrom, filters.dateTo)
      : null;
  const { data: pageRows, error: pageError } = await client.rpc("get_clip_page", {
    p_cursor_clip_created_at: cursor?.clipCreatedAt,
    p_cursor_id: cursor?.id,
    p_date_end: dateRange?.end,
    p_date_start: dateRange?.start,
    p_day_number: filters.day ?? undefined,
    p_groups: filters.groups,
    p_jobs: filters.jobs,
    p_limit: PAGE_SIZE + 1,
    p_participant_ids: participantIds ?? undefined,
    p_sort: filters.sort,
    p_tag_ids: filters.tagIds,
  });

  if (pageError) {
    throw new Error("클립을 불러오지 못함.", { cause: pageError });
  }

  const hasNextPage = pageRows.length > PAGE_SIZE;
  const visiblePageRows = hasNextPage ? pageRows.slice(0, PAGE_SIZE) : pageRows;

  if (visiblePageRows.length === 0) {
    return { items: [], nextCursor: null };
  }

  const { data: sourceRows, error: sourceError } = await createClipRowsQuery(client)
    .in("id", visiblePageRows.map((row) => row.clip_id));

  if (sourceError) {
    throw new Error("클립을 불러오지 못함.", { cause: sourceError });
  }

  const seasonId = sourceRows[0]?.season_id;

  if (seasonId === undefined) {
    throw new Error("클립 시즌 정보를 확인하지 못함.");
  }

  const [careerEventsByParticipant, viewer] = await Promise.all([
    getCareerEventsByParticipant(client, seasonId, sourceRows),
    viewerPromise,
  ]);
  const sourceRowsById = new Map(sourceRows.map((row) => [row.id, row]));
  const items = visiblePageRows.map((pageRow) => {
    const sourceRow = sourceRowsById.get(pageRow.clip_id);

    if (!sourceRow) {
      throw new Error("클립 상세 정보를 확인하지 못함.");
    }

    return toClipItem(sourceRow, careerEventsByParticipant, viewer);
  });
  const last = items.at(-1);

  return {
    items,
    nextCursor: hasNextPage && last
      ? { clipCreatedAt: last.clipCreatedAt, id: last.id }
      : null,
  };
}

export async function getClipPageForArchiveParticipant(
  seasonId: number,
  participantId: string,
  seasonDayId: string | null,
  cursor: ClipCursor | null,
  sort: ClipListFilters["sort"],
): Promise<ClipPage> {
  const client = getSupabaseServerClient();
  const viewer = await getCurrentUser();
  let query = createClipRowsQuery(client)
    .eq("season_id", seasonId)
    .eq("season_participant_id", participantId)
    .order("clip_created_at", { ascending: sort === "oldest" })
    .order("id", { ascending: sort === "oldest" })
    .limit(PAGE_SIZE + 1);

  if (seasonDayId !== null) {
    query = query.eq("season_day_id", seasonDayId);
  }

  if (cursor !== null) {
    query = query.or(getCursorFilter(cursor, sort));
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("시스템 아카이브 클립을 불러오지 못함.", { cause: error });
  }

  const hasNextPage = data.length > PAGE_SIZE;
  const rows = hasNextPage ? data.slice(0, PAGE_SIZE) : data;
  const careerEventsByParticipant = await getCareerEventsByParticipant(client, seasonId, rows);
  const items = rows.map((row) => toClipItem(row, careerEventsByParticipant, viewer));
  const last = items.at(-1);

  return {
    items,
    nextCursor: hasNextPage && last
      ? { clipCreatedAt: last.clipCreatedAt, id: last.id }
      : null,
  };
}

export async function getClipNeighborsForArchiveParticipant(
  seasonId: number,
  participantId: string,
  seasonDayId: string | null,
  clipId: string,
  sort: ClipListFilters["sort"],
): Promise<ClipItem[]> {
  const client = getSupabaseServerClient();
  const viewer = await getCurrentUser();
  let currentQuery = createClipRowsQuery(client)
    .eq("season_id", seasonId)
    .eq("season_participant_id", participantId)
    .eq("id", clipId)
    .limit(1);

  if (seasonDayId !== null) {
    currentQuery = currentQuery.eq("season_day_id", seasonDayId);
  }

  const currentResult = await currentQuery;

  if (currentResult.error) {
    throw new Error("클립 미리보기를 불러오지 못함.", { cause: currentResult.error });
  }

  const current = currentResult.data[0];

  if (!current) {
    return [];
  }

  const previousOperator = sort === "oldest" ? "lt" : "gt";
  const nextOperator = sort === "oldest" ? "gt" : "lt";
  const previousAscending = sort === "latest";
  const nextAscending = sort === "oldest";
  const cursor = { clipCreatedAt: current.clip_created_at, id: current.id };
  const createNeighborQuery = () => {
    let query = createClipRowsQuery(client)
      .eq("season_id", seasonId)
      .eq("season_participant_id", participantId);

    if (seasonDayId !== null) {
      query = query.eq("season_day_id", seasonDayId);
    }

    return query;
  };
  const [previousResult, nextResult] = await Promise.all([
    createNeighborQuery()
      .or(getRelativeCursorFilter(cursor, previousOperator))
      .order("clip_created_at", { ascending: previousAscending })
      .order("id", { ascending: previousAscending })
      .limit(4),
    createNeighborQuery()
      .or(getRelativeCursorFilter(cursor, nextOperator))
      .order("clip_created_at", { ascending: nextAscending })
      .order("id", { ascending: nextAscending })
      .limit(4),
  ]);

  if (previousResult.error || nextResult.error) {
    throw new Error("주변 클립을 불러오지 못함.", {
      cause: previousResult.error ?? nextResult.error,
    });
  }

  const candidates = [...previousResult.data.reverse(), current, ...nextResult.data];
  const currentIndex = candidates.findIndex((row) => row.id === current.id);
  const start = Math.min(
    Math.max(0, currentIndex - 2),
    Math.max(0, candidates.length - 5),
  );
  const rows = candidates.slice(start, start + 5);
  const careerEventsByParticipant = await getCareerEventsByParticipant(client, seasonId, rows);

  return rows.map((row) => toClipItem(row, careerEventsByParticipant, viewer));
}

async function getActiveSeasonId(client: SupabaseClient<Database>): Promise<number> {
  const { data, error } = await createActiveSeasonQuery(client);

  if (error || data.length !== 1) {
    throw new Error("활성 시즌을 확인하지 못함.", { cause: error });
  }

  return data[0].id;
}

async function resolveClipParticipantIds(
  client: SupabaseClient<Database>,
  filters: ClipListFilters,
): Promise<string[] | null> {
  const query = filters.query.trim();

  if (!query) {
    return filters.participantIds.length > 0 ? filters.participantIds : null;
  }

  const seasonId = await getActiveSeasonId(client);
  const { data, error } = await createParticipantCandidatesQuery(client)
    .eq("season_id", seasonId);

  if (error) {
    throw new Error("클립 인물 필터를 확인하지 못함.", { cause: error });
  }

  return data
    .filter((participant) =>
      (filters.participantIds.length === 0 || filters.participantIds.includes(participant.id)) &&
      (
        matchesKoreanSearch(participant.streamer.name, query) ||
        (participant.rp_name !== null && matchesKoreanSearch(participant.rp_name, query))
      )
    )
    .map((participant) => participant.id);
}

async function getCareerEventsByParticipant(
  client: SupabaseClient<Database>,
  seasonId: number,
  clips: ClipSourceRow[],
): Promise<Map<string, CareerEventsByParticipant>> {
  const participantIds = Array.from(
    new Set(
      clips
        .map((clip) => clip.season_participant_id)
        .filter((participantId): participantId is string => participantId !== null),
    ),
  );

  if (participantIds.length === 0) {
    return new Map();
  }

  const { data, error } = await createCareerEventsQuery(client)
    .eq("season_id", seasonId)
    .in("participant_id", participantIds)
    .order("event_date", { ascending: true })
    .order("sequence_in_day", { ascending: true });

  if (error) {
    throw new Error("클립 당시 이력을 불러오지 못함.", { cause: error });
  }

  const eventsByParticipant = new Map<string, CareerEventsByParticipant>();

  for (const row of data) {
    const entry = eventsByParticipant.get(row.participant_id) ?? {
      categoriesByOrganizationId: new Map<string, string | null>(),
      events: [],
    };
    const event = toCharacterCareerEvent(row, entry.categoriesByOrganizationId);

    if (event) {
      entry.events.push(event);
    }

    eventsByParticipant.set(row.participant_id, entry);
  }

  return eventsByParticipant;
}

function toCharacterCareerEvent(
  row: CareerEventRow,
  categoriesByOrganizationId: Map<string, string | null>,
): CharacterCareerEvent | null {
  const eventType = toCareerEventType(row.event_type);

  if (eventType === null) {
    return null;
  }

  addOrganizationCategory(row.from_organization, categoriesByOrganizationId);
  addOrganizationCategory(row.to_organization, categoriesByOrganizationId);

  return {
    eventAt: row.event_at,
    eventDate: row.event_date,
    eventType,
    fromOrganization: toCareerOrganization(row.from_organization),
    fromRole: row.from_role,
    id: row.id,
    note: row.note,
    seasonDayId: row.season_day_id,
    sequenceInDay: row.sequence_in_day,
    sourceUrl: row.source_url,
    toOrganization: toCareerOrganization(row.to_organization),
    toRole: row.to_role,
  };
}

function toCareerEventType(value: string): CharacterCareerEventType | null {
  switch (value) {
    case "appoint":
    case "demote":
    case "join":
    case "leave":
    case "promote":
    case "transfer":
      return value;
    default:
      return null;
  }
}

function addOrganizationCategory(
  organization: CareerEventRow["from_organization"],
  categoriesByOrganizationId: Map<string, string | null>,
) {
  if (organization) {
    categoriesByOrganizationId.set(organization.id, toOrganizationCategory(organization.type));
  }
}

function toCareerOrganization(
  organization: CareerEventRow["from_organization"],
) {
  return organization
    ? { id: organization.id, name: organization.name, slug: organization.slug }
    : null;
}

function toOrganizationCategory(type: string): string | null {
  switch (type) {
    case "institution":
    case "public-service":
      return "public-service";
    case "business":
    case "illegal-business":
    case "gang":
    case "crew":
      return type;
    default:
      return null;
  }
}

function toClipItem(
  row: ClipSourceRow,
  careerEventsByParticipant: Map<string, CareerEventsByParticipant>,
  viewer: AuthenticatedUser | null,
): ClipItem {
  const career = row.season_participant_id
    ? careerEventsByParticipant.get(row.season_participant_id)
    : undefined;
  const state = career && career.events.length > 0
    ? getCharacterStateAt(career.events, row.clip_created_at)
    : null;

  return {
    clipCreatedAt: row.clip_created_at,
    clipUrl: row.clip_url,
    durationSeconds: row.duration_seconds,
    historicalAffiliations:
      state?.isComplete
        ? state.affiliations.map((affiliation) => ({
            organizationName: affiliation.organization.name,
            organizationSlug: affiliation.organization.slug,
            role: affiliation.role,
          }))
        : [],
    id: row.id,
    participant: row.participant
      ? {
          id: row.participant.id,
          profileImageUrl: getR2PublicUrl(row.participant.portrait_image_key),
          rpName: row.participant.rp_name,
          streamerName: row.participant.streamer.name,
        }
      : null,
    seasonDay: row.season_day
      ? {
          dayNumber: row.season_day.day_number,
          id: row.season_day.id,
          sessionDate: row.season_day.session_date,
        }
      : null,
    tags: row.clip_tags.map((clipTag) => ({
      canDelete: viewer !== null && viewer.status === "active" && (
        viewer.id === clipTag.created_by || viewer.role === "admin"
      ),
      id: clipTag.tag.id,
      name: clipTag.tag.name,
    })),
    thumbnailUrl: row.thumbnail_url,
    title: row.title,
    viewCount: row.view_count,
  };
}

function getCursorFilter(cursor: ClipCursor, sort: ClipListFilters["sort"]): string {
  const operator = sort === "oldest" ? "gt" : "lt";

  return getRelativeCursorFilter(cursor, operator);
}

function getRelativeCursorFilter(cursor: ClipCursor, operator: "gt" | "lt"): string {
  return `clip_created_at.${operator}.${cursor.clipCreatedAt},and(clip_created_at.eq.${cursor.clipCreatedAt},id.${operator}.${cursor.id})`;
}
