import "server-only";

import type { QueryData, SupabaseClient } from "@supabase/supabase-js";

import {
  getCharacterStateAt,
  type CharacterCareerEvent,
  type CharacterCareerEventType,
} from "@/features/characters/character-career";
import { getKstDateRange } from "@/features/seasons/season-date";
import { getR2PublicUrl } from "@/lib/r2";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";
import { matchesKoreanSearch } from "@/utils/korean-search";

import type {
  ReplayCursor,
  ReplayItem,
  ReplayListFilters,
  ReplayOptions,
  ReplayPage,
  ReplaySession,
} from "./replay";

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

function createReplayRowsQuery(client: SupabaseClient<Database>) {
  return client.from("replays").select(`
    id,
    title,
    thumbnail_url,
    replay_url,
    duration_seconds,
    view_count,
    live_started_at,
    published_at,
    sort_at,
    season_participant_id,
    participant:season_participants!replays_participant_same_season_fkey (
      id,
      rp_name,
      portrait_image_key,
      streamer:streamers!inner (
        name
      )
    ),
    season_day:season_days!replays_season_day_same_season_fkey (
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
type ReplaySourceRow = QueryData<ReturnType<typeof createReplayRowsQuery>>[number];
type CareerEventRow = QueryData<ReturnType<typeof createCareerEventsQuery>>[number];

interface CareerEventsByParticipant {
  categoriesByOrganizationId: Map<string, string | null>;
  events: CharacterCareerEvent[];
}

export async function getReplayOptions(): Promise<ReplayOptions> {
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

export async function getReplayPage(
  filters: ReplayListFilters,
  cursor: ReplayCursor | null,
): Promise<ReplayPage> {
  const client = getSupabaseAdminClient();
  const seasonId = await getActiveSeasonId(client);
  const participantIds = await resolveParticipantIds(client, seasonId, filters);

  if (participantIds?.length === 0) {
    return { items: [], nextCursor: null };
  }

  const dateRange = filters.date ? getKstDateRange(filters.date) : null;
  const { data: sessionRows, error: sessionError } = await client.rpc(
    "get_replay_session_page",
    {
      p_cursor_id: cursor?.id ?? undefined,
      p_cursor_sort_at: cursor?.sortAt ?? undefined,
      p_date_end: dateRange?.end ?? undefined,
      p_date_start: dateRange?.start ?? undefined,
      p_day_number: filters.day ?? undefined,
      p_jobs: filters.jobs.length > 0 ? filters.jobs : undefined,
      p_limit: PAGE_SIZE + 1,
      p_participant_ids: participantIds ?? undefined,
    },
  );

  if (sessionError) {
    throw new Error("다시보기를 불러오지 못함.", { cause: sessionError });
  }

  const hasNextPage = sessionRows.length > PAGE_SIZE;
  const visibleSessionRows = hasNextPage ? sessionRows.slice(0, PAGE_SIZE) : sessionRows;
  const replayIds = visibleSessionRows.flatMap((session) => session.replay_ids);

  if (replayIds.length === 0) return { items: [], nextCursor: null };

  const replayRows: ReplaySourceRow[] = [];

  for (let offset = 0; offset < replayIds.length; offset += 100) {
    const { data, error } = await createReplayRowsQuery(client)
      .eq("season_id", seasonId)
      .is("excluded_at", null)
      .in("id", replayIds.slice(offset, offset + 100));

    if (error) throw new Error("다시보기를 불러오지 못함.", { cause: error });
    replayRows.push(...data);
  }

  const displayCareerEvents = await getCareerEventsByParticipant(client, seasonId, replayRows);
  const replayById = new Map(
    replayRows.map((row) => [row.id, toReplayItem(row, displayCareerEvents)]),
  );
  const items: ReplaySession[] = visibleSessionRows.flatMap((session) => {
    const replays = session.replay_ids.flatMap((id) => {
      const replay = replayById.get(id);
      return replay ? [replay] : [];
    });

    return replays.length > 0
      ? [{
          endedAt: session.ended_at,
          id: session.session_id,
          replays,
          startedAt: session.started_at,
        }]
      : [];
  });
  const lastSession = visibleSessionRows.at(-1);

  return {
    items,
    nextCursor: hasNextPage && lastSession
      ? { id: lastSession.session_id, sortAt: lastSession.sort_at }
      : null,
  };
}

async function getActiveSeasonId(client: SupabaseClient<Database>): Promise<number> {
  const { data, error } = await createActiveSeasonQuery(client);

  if (error || data.length !== 1) {
    throw new Error("활성 시즌을 확인하지 못함.", { cause: error });
  }

  return data[0].id;
}

async function resolveParticipantIds(
  client: SupabaseClient<Database>,
  seasonId: number,
  filters: ReplayListFilters,
): Promise<string[] | null> {
  const hasQuery = filters.query.trim().length > 0;
  const hasGroups = filters.groups.length > 0;

  if (!hasQuery && !hasGroups) {
    return filters.participantIds.length > 0 ? filters.participantIds : null;
  }

  const { data, error } = await createParticipantCandidatesQuery(client)
    .eq("season_id", seasonId);

  if (error) {
    throw new Error("다시보기 인물 필터를 확인하지 못함.", { cause: error });
  }

  const selectedGroupSlugs = resolveSelectedGroupSlugs(data, filters.groups);

  return data
    .filter((participant) => {
      if (
        filters.participantIds.length > 0 &&
        !filters.participantIds.includes(participant.id)
      ) {
        return false;
      }

      const isQueryMatched =
        !hasQuery ||
        matchesKoreanSearch(participant.streamer.name, filters.query) ||
        (participant.rp_name !== null && matchesKoreanSearch(participant.rp_name, filters.query));
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
  const affiliationsBySlug = new Map<string, { id: string; parentAffiliationId: string | null }>();
  const childrenByParentId = new Map<string, string[]>();

  for (const participant of participants) {
    for (const membership of participant.streamer.affiliation_memberships) {
      const affiliation = membership.affiliation;
      affiliationsBySlug.set(affiliation.slug, {
        id: affiliation.id,
        parentAffiliationId: affiliation.parent_affiliation_id,
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
    if (resolved.has(slug)) return;

    resolved.add(slug);
    const affiliation = affiliationsBySlug.get(slug);

    if (!affiliation) return;

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
  replays: Array<{ season_participant_id: string | null }>,
): Promise<Map<string, CareerEventsByParticipant>> {
  const participantIds = Array.from(
    new Set(
      replays
        .map((replay) => replay.season_participant_id)
        .filter((participantId): participantId is string => participantId !== null),
    ),
  );

  if (participantIds.length === 0) return new Map();

  const { data, error } = await createCareerEventsQuery(client)
    .eq("season_id", seasonId)
    .in("participant_id", participantIds)
    .order("event_date", { ascending: true })
    .order("sequence_in_day", { ascending: true });

  if (error) {
    throw new Error("다시보기 당시 이력을 불러오지 못함.", { cause: error });
  }

  const eventsByParticipant = new Map<string, CareerEventsByParticipant>();

  for (const row of data) {
    const entry = eventsByParticipant.get(row.participant_id) ?? {
      categoriesByOrganizationId: new Map<string, string | null>(),
      events: [],
    };
    const event = toCharacterCareerEvent(row, entry.categoriesByOrganizationId);

    if (event) entry.events.push(event);

    eventsByParticipant.set(row.participant_id, entry);
  }

  return eventsByParticipant;
}

function toCharacterCareerEvent(
  row: CareerEventRow,
  categoriesByOrganizationId: Map<string, string | null>,
): CharacterCareerEvent | null {
  const eventType = toCareerEventType(row.event_type);

  if (eventType === null) return null;

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

function toCareerOrganization(organization: CareerEventRow["from_organization"]) {
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

function toReplayItem(
  row: ReplaySourceRow,
  careerEventsByParticipant: Map<string, CareerEventsByParticipant>,
): ReplayItem {
  const replayTime = row.live_started_at ?? row.published_at;
  const career = row.season_participant_id
    ? careerEventsByParticipant.get(row.season_participant_id)
    : undefined;
  const state = career && career.events.length > 0 && replayTime
    ? getCharacterStateAt(career.events, replayTime)
    : null;

  return {
    durationSeconds: row.duration_seconds,
    historicalAffiliations: state?.isComplete
      ? state.affiliations.map((affiliation) => ({
          organizationName: affiliation.organization.name,
          organizationSlug: affiliation.organization.slug,
          role: affiliation.role,
        }))
      : [],
    id: row.id,
    liveStartedAt: row.live_started_at,
    participant: row.participant
      ? {
          id: row.participant.id,
          profileImageUrl: getR2PublicUrl(row.participant.portrait_image_key),
          rpName: row.participant.rp_name,
          streamerName: row.participant.streamer.name,
        }
      : null,
    publishedAt: row.published_at,
    replayUrl: row.replay_url,
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
