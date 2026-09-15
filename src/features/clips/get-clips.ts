import "server-only";

import type { QueryData, SupabaseClient } from "@supabase/supabase-js";

import {
  getCharacterStateAt,
  type CharacterCareerEvent,
  type CharacterCareerEventType,
} from "@/features/characters/character-career";
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
import { getKstDateRange } from "@/features/seasons/season-date";
import { matchesKoreanSearch } from "@/utils/korean-search";

const PAGE_SIZE = 24;
const SOURCE_BATCH_SIZE = 48;
const MAX_SCAN_BATCHES = 6;

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

function createClipRowsQuery(client: SupabaseClient<Database>) {
  return client.from("clips").select(`
    id,
    title,
    thumbnail_url,
    clip_url,
    duration_seconds,
    view_count,
    clip_created_at,
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

type ParticipantCandidate = QueryData<ReturnType<typeof createParticipantCandidatesQuery>>[number];
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
  const seasonId = await getActiveSeasonId(client);
  const participantIds = await resolveParticipantIds(client, seasonId, filters);

  if (participantIds?.length === 0) {
    return { items: [], nextCursor: null };
  }

  const seasonDayId = await resolveSeasonDayId(client, seasonId, filters.day);

  if (filters.day !== null && seasonDayId === null) {
    return { items: [], nextCursor: null };
  }

  const dateRange = filters.date ? getKstDateRange(filters.date) : null;
  const items: ClipItem[] = [];
  let sourceCursor = cursor;

  for (let scanBatch = 0; scanBatch < MAX_SCAN_BATCHES; scanBatch += 1) {
    let query = createClipRowsQuery(client)
      .eq("season_id", seasonId)
      .order("clip_created_at", { ascending: filters.sort === "oldest" })
      .order("id", { ascending: filters.sort === "oldest" })
      .limit(SOURCE_BATCH_SIZE);

    if (participantIds !== null) {
      query = query.in("season_participant_id", participantIds);
    }

    if (seasonDayId !== null) {
      query = query.eq("season_day_id", seasonDayId);
    }

    if (dateRange !== null) {
      query = query
        .gte("clip_created_at", dateRange.start)
        .lt("clip_created_at", dateRange.end);
    }

    if (sourceCursor !== null) {
      query = query.or(getCursorFilter(sourceCursor, filters.sort));
    }

    const { data, error } = await query;

    if (error) {
      throw new Error("클립을 불러오지 못함.", { cause: error });
    }

    if (data.length === 0) {
      return { items, nextCursor: null };
    }

    const careerEventsByParticipant = await getCareerEventsByParticipant(
      client,
      seasonId,
      data,
    );

    for (let index = 0; index < data.length; index += 1) {
      const row = data[index];
      sourceCursor = { clipCreatedAt: row.clip_created_at, id: row.id };
      const clip = toClipItem(row, careerEventsByParticipant);

      if (!matchesJobFilters(clip, filters.jobs, careerEventsByParticipant)) {
        continue;
      }

      items.push(clip);

      if (items.length === PAGE_SIZE) {
        const hasUnscannedSourceRows = index < data.length - 1;
        const mayHaveMoreRows = hasUnscannedSourceRows || data.length === SOURCE_BATCH_SIZE;

        return {
          items,
          nextCursor: mayHaveMoreRows ? sourceCursor : null,
        };
      }
    }

    if (data.length < SOURCE_BATCH_SIZE) {
      return { items, nextCursor: null };
    }
  }

  return { items, nextCursor: sourceCursor };
}

async function getActiveSeasonId(client: SupabaseClient<Database>): Promise<number> {
  const { data, error } = await createActiveSeasonQuery(client);

  if (error || data.length !== 1) {
    throw new Error("활성 시즌을 확인하지 못함.", { cause: error });
  }

  return data[0].id;
}

async function resolveSeasonDayId(
  client: SupabaseClient<Database>,
  seasonId: number,
  dayNumber: number | null,
): Promise<string | null> {
  if (dayNumber === null) {
    return null;
  }

  const { data, error } = await client
    .from("season_days")
    .select("id")
    .eq("season_id", seasonId)
    .eq("day_number", dayNumber)
    .maybeSingle();

  if (error) {
    throw new Error("봉누도 일차를 확인하지 못함.", { cause: error });
  }

  return data?.id ?? null;
}

async function resolveParticipantIds(
  client: SupabaseClient<Database>,
  seasonId: number,
  filters: ClipListFilters,
): Promise<string[] | null> {
  const hasQuery = filters.query.trim().length > 0;
  const hasGroups = filters.groups.length > 0;

  if (!hasQuery && !hasGroups) {
    return filters.participantId ? [filters.participantId] : null;
  }

  const { data, error } = await createParticipantCandidatesQuery(client)
    .eq("season_id", seasonId);

  if (error) {
    throw new Error("클립 인물 필터를 확인하지 못함.", { cause: error });
  }

  const selectedGroupSlugs = resolveSelectedGroupSlugs(data, filters.groups);

  return data
    .filter((participant) => {
      if (filters.participantId && participant.id !== filters.participantId) {
        return false;
      }

      const isQueryMatched =
        !hasQuery ||
        matchesKoreanSearch(participant.streamer.name, filters.query) ||
        (participant.rp_name !== null &&
          matchesKoreanSearch(participant.rp_name, filters.query));
      const isGroupMatched =
        selectedGroupSlugs.size === 0 ||
        participant.streamer.affiliation_memberships.some((membership) =>
          selectedGroupSlugs.has(membership.affiliation.slug),
        );

      return isQueryMatched && isGroupMatched;
    })
    .map((participant) => participant.id);
}

function resolveSelectedGroupSlugs(
  participants: ParticipantCandidate[],
  selectedGroupSlugs: string[],
): Set<string> {
  const affiliationsBySlug = new Map<string, {
    id: string;
    parentAffiliationId: string | null;
    slug: string;
  }>();
  const childrenByParentId = new Map<string, string[]>();

  for (const participant of participants) {
    for (const membership of participant.streamer.affiliation_memberships) {
      const affiliation = membership.affiliation;
      affiliationsBySlug.set(affiliation.slug, {
        id: affiliation.id,
        parentAffiliationId: affiliation.parent_affiliation_id,
        slug: affiliation.slug,
      });

      if (affiliation.parent_affiliation_id) {
        const children = childrenByParentId.get(affiliation.parent_affiliation_id) ?? [];
        children.push(affiliation.slug);
        childrenByParentId.set(affiliation.parent_affiliation_id, children);
      }
    }
  }

  const resolved = new Set<string>();

  function addBranch(slug: string) {
    if (resolved.has(slug)) {
      return;
    }

    resolved.add(slug);
    const affiliation = affiliationsBySlug.get(slug);

    if (!affiliation) {
      return;
    }

    for (const childSlug of childrenByParentId.get(affiliation.id) ?? []) {
      addBranch(childSlug);
    }
  }

  for (const slug of selectedGroupSlugs) {
    addBranch(slug);
  }

  return resolved;
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
    thumbnailUrl: row.thumbnail_url,
    title: row.title,
    viewCount: row.view_count,
  };
}

function matchesJobFilters(
  clip: ClipItem,
  selectedJobs: string[],
  careerEventsByParticipant: Map<string, CareerEventsByParticipant>,
): boolean {
  if (selectedJobs.length === 0) {
    return true;
  }

  if (!clip.participant) {
    return false;
  }

  const career = careerEventsByParticipant.get(clip.participant.id);

  if (!career || career.events.length === 0) {
    return false;
  }

  const state = getCharacterStateAt(career.events, clip.clipCreatedAt);

  if (!state.isComplete) {
    return false;
  }

  const selected = new Set(selectedJobs);

  return state.affiliations.some((affiliation) =>
    selected.has(affiliation.organization.slug) ||
    selected.has(career.categoriesByOrganizationId.get(affiliation.organization.id) ?? ""),
  );
}

function getCursorFilter(cursor: ClipCursor, sort: ClipListFilters["sort"]): string {
  const operator = sort === "oldest" ? "gt" : "lt";

  return `clip_created_at.${operator}.${cursor.clipCreatedAt},and(clip_created_at.eq.${cursor.clipCreatedAt},id.${operator}.${cursor.id})`;
}
