import "server-only";

import type { QueryData } from "@supabase/supabase-js";

import type { AuthenticatedUser } from "@/features/auth/session";
import {
  getClipNeighborsForArchiveParticipant,
  getClipPageForArchiveParticipant,
} from "@/features/clips/get-clips";
import type { ClipCursor, ClipPage, ClipSort } from "@/features/clips/clip";
import type { Database, Json } from "@/lib/supabase/database.types";
import { getR2PublicUrl } from "@/lib/r2";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

import type {
  ArchiveCategory,
  ArchiveDetail,
  ArchiveEditorOptions,
  ArchiveEditPolicy,
  ArchiveKind,
  ArchiveListCursor,
  ArchiveListFilters,
  ArchiveListItem,
  ArchivePage,
  ArchivePersonDetail,
  ArchivePeopleFilters,
  ArchivePeoplePage,
  ArchivePeopleSection,
  ArchiveSaveResult,
  ArchiveStatus,
  ArchiveStoryType,
  ArchiveStructureMode,
  ArchiveSystemClipSummary,
  ArchiveVisibility,
  MyArchiveCursor,
  MyArchiveListItem,
  MyArchivePage,
  MyArchiveTab,
} from "./archive";
import { ArchiveRequestError } from "./archive-error";
import { canEditArchiveContent } from "./archive-permission";
import {
  createArchiveRequestSchema,
  parseArchiveSnapshot,
  restoreArchiveRevisionRequestSchema,
  saveArchiveContentRequestSchema,
  saveArchiveRequestSchema,
  toArchiveContentInput,
  toArchiveMetadataInput,
  toArchiveSaveInput,
  updateArchiveMetadataRequestSchema,
} from "./archive-validation";

interface ArchiveRpcError {
  message: string;
}

function createArchiveClipSummaryQuery() {
  return getSupabaseAdminClient().from("clips").select(`
    id,
    title,
    thumbnail_url,
    clip_url,
    clip_created_at,
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

type ArchiveClipSummaryRow = QueryData<ReturnType<typeof createArchiveClipSummaryQuery>>[number];
type PublicArchivePageRow = Database["public"]["Functions"]["get_public_archive_page"]["Returns"][number];
type MyArchivePageRow = Database["public"]["Functions"]["get_my_archive_page"]["Returns"][number];

const ARCHIVE_LIST_PAGE_SIZE = 24;
const MY_ARCHIVE_LIST_PAGE_SIZE = 20;
const DAY_RELATED_ARCHIVE_LIMIT = 12;

export async function createArchive(
  user: AuthenticatedUser,
  rawRequest: unknown,
): Promise<ArchiveSaveResult> {
  const request = parseArchiveRequest(createArchiveRequestSchema, rawRequest);
  const supabase = getSupabaseAdminClient();
  const result = await supabase.rpc("create_archive", {
    p_actor_user_id: user.id,
    p_content: toArchiveContentJson(toArchiveContentInput(request.content)),
    p_metadata: toArchiveMetadataJson(toArchiveMetadataInput(request.metadata)),
    p_season_id: request.seasonId,
  });

  return toArchiveSaveResult(result.data, result.error);
}

export async function saveArchiveContent(
  user: AuthenticatedUser,
  archiveId: string,
  rawRequest: unknown,
): Promise<ArchiveSaveResult> {
  const request = parseArchiveRequest(saveArchiveContentRequestSchema, rawRequest);
  const supabase = getSupabaseAdminClient();
  const result = await supabase.rpc("save_archive_content", {
    p_actor_user_id: user.id,
    p_archive_id: archiveId,
    p_base_revision: request.baseRevision,
    p_content: toArchiveContentJson(toArchiveContentInput(request.content)),
  });

  return toArchiveSaveResult(result.data, result.error);
}

export async function saveArchive(
  user: AuthenticatedUser,
  archiveId: string,
  rawRequest: unknown,
): Promise<ArchiveSaveResult> {
  const request = toArchiveSaveInput(
    parseArchiveRequest(saveArchiveRequestSchema, rawRequest),
  );
  const supabase = getSupabaseAdminClient();
  const result = await supabase.rpc("save_archive", {
    p_actor_user_id: user.id,
    p_archive_id: archiveId,
    p_base_revision: request.baseRevision,
    p_content: toArchiveContentJson(request.content),
    p_metadata: request.metadata ? toArchiveMetadataJson(request.metadata) : null,
  });

  return toArchiveSaveResult(result.data, result.error);
}

export async function updateArchiveMetadata(
  user: AuthenticatedUser,
  archiveId: string,
  rawRequest: unknown,
): Promise<ArchiveSaveResult> {
  const request = parseArchiveRequest(updateArchiveMetadataRequestSchema, rawRequest);
  const supabase = getSupabaseAdminClient();
  const result = await supabase.rpc("update_archive_metadata", {
    p_actor_user_id: user.id,
    p_archive_id: archiveId,
    p_base_revision: request.baseRevision,
    p_metadata: toArchiveMetadataJson(toArchiveMetadataInput(request.metadata)),
  });

  return toArchiveSaveResult(result.data, result.error);
}

export async function restoreArchiveRevision(
  user: AuthenticatedUser,
  archiveId: string,
  rawRequest: unknown,
): Promise<ArchiveSaveResult> {
  const request = parseArchiveRequest(restoreArchiveRevisionRequestSchema, rawRequest);
  const supabase = getSupabaseAdminClient();
  const result = await supabase.rpc("restore_archive_revision", {
    p_actor_user_id: user.id,
    p_archive_id: archiveId,
    p_base_revision: request.baseRevision,
    p_revision_number: request.revisionNumber,
  });

  return toArchiveSaveResult(result.data, result.error);
}

export async function softDeleteArchive(
  user: AuthenticatedUser,
  archiveId: string,
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const result = await supabase.rpc("soft_delete_archive", {
    p_actor_user_id: user.id,
    p_archive_id: archiveId,
  });

  if (result.error) {
    throwArchiveRpcError(result.error);
  }
}

export async function restoreArchive(
  user: AuthenticatedUser,
  archiveId: string,
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const result = await supabase.rpc("restore_archive", {
    p_actor_user_id: user.id,
    p_archive_id: archiveId,
  });

  if (result.error) {
    throwArchiveRpcError(result.error);
  }
}

export async function getPublicArchivePage(
  filters: ArchiveListFilters,
  cursor: ArchiveListCursor | null,
): Promise<ArchivePage> {
  const supabase = getSupabaseAdminClient();
  const result = await supabase.rpc("get_public_archive_page", {
    p_limit: ARCHIVE_LIST_PAGE_SIZE + 1,
    p_sort: filters.sort,
    p_type: filters.type,
    ...(filters.category ? { p_category: filters.category } : {}),
    ...(cursor ? { p_cursor_id: cursor.id, p_cursor_sort_at: cursor.sortAt } : {}),
    ...(filters.participantId ? { p_participant_id: filters.participantId } : {}),
    ...(filters.query ? { p_query: filters.query } : {}),
    ...(filters.status ? { p_status: filters.status } : {}),
  });

  if (result.error) {
    throw new ArchiveRequestError("공개 아카이브를 불러오지 못했습니다.", 500, {
      cause: result.error,
    });
  }

  const rows = result.data;
  const items = rows.slice(0, ARCHIVE_LIST_PAGE_SIZE).map(toArchiveListItem);
  const lastItem = items.at(-1);

  return {
    items,
    nextCursor: rows.length > ARCHIVE_LIST_PAGE_SIZE && lastItem
      ? { id: lastItem.id, sortAt: lastItem.sortAt }
      : null,
  };
}

export async function getPublicUserArchivesForSeasonDay(
  seasonDayId: string,
): Promise<ArchiveListItem[]> {
  const supabase = getSupabaseAdminClient();
  const matchingItemsResult = await supabase
    .from("archive_day_relations")
    .select("archive_id")
    .eq("season_day_id", seasonDayId);

  if (matchingItemsResult.error) {
    throw new ArchiveRequestError("관련 아카이브를 불러오지 못했습니다.", 500, {
      cause: matchingItemsResult.error,
    });
  }

  const archiveIds = Array.from(new Set(
    (matchingItemsResult.data ?? []).map((item) => item.archive_id),
  ));

  if (archiveIds.length === 0) {
    return [];
  }

  const archivesResult = await supabase
    .from("archives")
    .select("id, category, description, published_at, status, title, updated_at")
    .in("id", archiveIds)
    .eq("archive_kind", "user")
    .eq("visibility", "public")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(DAY_RELATED_ARCHIVE_LIMIT);

  if (archivesResult.error) {
    throw new ArchiveRequestError("관련 아카이브를 불러오지 못했습니다.", 500, {
      cause: archivesResult.error,
    });
  }

  const publicArchiveIds = (archivesResult.data ?? []).map((archive) => archive.id);

  if (publicArchiveIds.length === 0) {
    return [];
  }

  const archiveItemsResult = await supabase
    .from("archive_items")
    .select(`
      archive_id,
      clip:clips!inner (
        clip_created_at,
        thumbnail_url
      )
    `)
    .in("archive_id", publicArchiveIds);

  if (archiveItemsResult.error) {
    throw new ArchiveRequestError("관련 아카이브를 불러오지 못했습니다.", 500, {
      cause: archiveItemsResult.error,
    });
  }

  const statsByArchiveId = new Map<string, {
    clipCount: number;
    firstClipCreatedAt: string;
    lastClipCreatedAt: string;
    representativeImageUrl: string | null;
  }>();

  for (const item of archiveItemsResult.data ?? []) {
    if (!item.clip) {
      continue;
    }

    const existing = statsByArchiveId.get(item.archive_id);

    if (!existing) {
      statsByArchiveId.set(item.archive_id, {
        clipCount: 1,
        firstClipCreatedAt: item.clip.clip_created_at,
        lastClipCreatedAt: item.clip.clip_created_at,
        representativeImageUrl: item.clip.thumbnail_url,
      });
      continue;
    }

    existing.clipCount += 1;
    existing.firstClipCreatedAt = existing.firstClipCreatedAt < item.clip.clip_created_at
      ? existing.firstClipCreatedAt
      : item.clip.clip_created_at;
    existing.lastClipCreatedAt = existing.lastClipCreatedAt > item.clip.clip_created_at
      ? existing.lastClipCreatedAt
      : item.clip.clip_created_at;
    existing.representativeImageUrl ??= item.clip.thumbnail_url;
  }

  return (archivesResult.data ?? []).map((archive) => {
    const stats = statsByArchiveId.get(archive.id);

    return {
      archiveKind: "user" as const,
      category: toArchiveCategory(archive.category),
      clipCount: stats?.clipCount ?? 0,
      description: archive.description,
      firstClipCreatedAt: stats?.firstClipCreatedAt ?? null,
      id: archive.id,
      lastClipCreatedAt: stats?.lastClipCreatedAt ?? null,
      ownerName: null,
      publishedAt: archive.published_at,
      representativeImageUrl: stats?.representativeImageUrl ?? null,
      sortAt: archive.updated_at,
      status: toArchiveStatus(archive.status),
      systemParticipant: null,
      title: archive.title,
      updatedAt: archive.updated_at,
    };
  });
}

export async function getArchivePersonDetail(
  participantId: string,
): Promise<ArchivePersonDetail | null> {
  const supabase = getSupabaseAdminClient();
  const [participantResult, systemArchiveResult, relatedRelationsResult] = await Promise.all([
    supabase
      .from("season_participants")
      .select(`
        id,
        rp_name,
        streamer:streamers!inner (
          name
        ),
        memberships:organization_memberships (
          display_order,
          is_primary,
          left_at,
          role,
          organization:organizations!inner (
            name,
            slug
          )
        )
      `)
      .eq("id", participantId)
      .maybeSingle(),
    supabase
      .from("archives")
      .select("id")
      .eq("archive_kind", "system_character")
      .eq("system_participant_id", participantId)
      .eq("visibility", "public")
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("archive_participant_relations")
      .select("archive_id")
      .eq("season_participant_id", participantId),
  ]);

  if (participantResult.error) {
    throw new ArchiveRequestError("인물 정보를 불러오지 못했습니다.", 500, {
      cause: participantResult.error,
    });
  }

  if (systemArchiveResult.error) {
    throw new ArchiveRequestError("전체 클립 아카이브를 불러오지 못했습니다.", 500, {
      cause: systemArchiveResult.error,
    });
  }

  if (relatedRelationsResult.error) {
    throw new ArchiveRequestError("관련 아카이브를 불러오지 못했습니다.", 500, {
      cause: relatedRelationsResult.error,
    });
  }

  const participant = participantResult.data;

  if (!participant) {
    return null;
  }

  const affiliations = participant.memberships
    .filter((membership) => membership.left_at === null)
    .map((membership) => ({
      displayOrder: membership.display_order,
      isPrimary: membership.is_primary,
      organizationName: membership.organization.name,
      organizationSlug: membership.organization.slug,
      role: membership.role,
    }))
    .sort((left, right) => {
      if (left.isPrimary !== right.isPrimary) {
        return left.isPrimary ? -1 : 1;
      }

      return left.displayOrder - right.displayOrder;
    });

  return {
    participant: {
      affiliations,
      id: participant.id,
      rpName: participant.rp_name,
      streamerName: participant.streamer.name,
    },
    relatedArchives: await getArchivePeopleUserArchives(
      relatedRelationsResult.data.map((relation) => relation.archive_id),
    ),
    systemArchiveId: systemArchiveResult.data?.id ?? null,
  };
}

export async function getArchivePeopleSections(
  participantIds: string[],
): Promise<ArchivePeopleSection[]> {
  const supabase = getSupabaseAdminClient();
  const [participantsResult, systemArchivesResult, clips, relatedRelationsResult] = await Promise.all([
    supabase
      .from("season_participants")
      .select(`
        id,
        rp_name,
        portrait_image_key,
        streamer:streamers!inner (
          name
        )
      `)
      .in("id", participantIds),
    supabase
      .from("archives")
      .select("id, category, description, published_at, status, system_participant_id, title, updated_at")
      .eq("archive_kind", "system_character")
      .eq("visibility", "public")
      .is("deleted_at", null)
      .in("system_participant_id", participantIds),
    getArchivePeopleClips(participantIds),
    supabase
      .from("archive_participant_relations")
      .select("archive_id, season_participant_id")
      .in("season_participant_id", participantIds),
  ]);

  if (participantsResult.error || systemArchivesResult.error || relatedRelationsResult.error) {
    throw new ArchiveRequestError("인물별 아카이브를 불러오지 못했습니다.", 500, {
      cause: participantsResult.error ?? systemArchivesResult.error ?? relatedRelationsResult.error ?? undefined,
    });
  }

  const archiveIdsByParticipantId = new Map<string, Set<string>>();
  for (const relation of relatedRelationsResult.data) {
    const participantArchiveIds = archiveIdsByParticipantId.get(relation.season_participant_id) ?? new Set<string>();
    participantArchiveIds.add(relation.archive_id);
    archiveIdsByParticipantId.set(relation.season_participant_id, participantArchiveIds);
  }

  const relatedArchiveIds = Array.from(new Set(
    relatedRelationsResult.data.map((relation) => relation.archive_id),
  ));
  const userArchives = await getArchivePeopleUserArchives(relatedArchiveIds);
  const userArchivesById = new Map(userArchives.map((archive) => [archive.id, archive]));
  const participantsById = new Map((participantsResult.data ?? []).map((participant) => [
    participant.id,
    participant,
  ]));
  const clipStatsByParticipantId = getClipStatsByParticipant(clips);
  const systemArchiveByParticipantId = new Map(
    (systemArchivesResult.data ?? []).flatMap((archive) => {
      const participantId = archive.system_participant_id;
      const participant = participantId ? participantsById.get(participantId) : null;

      if (!participantId || !participant) return [];

      const stats = clipStatsByParticipantId.get(participantId);
      const item: ArchiveListItem = {
        archiveKind: "system_character",
        category: toArchiveCategory(archive.category),
        clipCount: stats?.clipCount ?? 0,
        description: archive.description,
        firstClipCreatedAt: stats?.firstClipCreatedAt ?? null,
        id: archive.id,
        lastClipCreatedAt: stats?.lastClipCreatedAt ?? null,
        ownerName: null,
        publishedAt: archive.published_at,
        representativeImageUrl:
          getR2PublicUrl(participant.portrait_image_key) ?? stats?.representativeImageUrl ?? null,
        sortAt: stats?.lastClipCreatedAt ?? archive.updated_at,
        status: toArchiveStatus(archive.status),
        systemParticipant: {
          id: participant.id,
          profileImageUrl: getR2PublicUrl(participant.portrait_image_key),
          rpName: participant.rp_name,
          streamerName: participant.streamer.name,
        },
        title: archive.title,
        updatedAt: archive.updated_at,
      };

      return [[participantId, item] as const];
    }),
  );

  return participantIds.flatMap((participantId) => {
    const participant = participantsById.get(participantId);
    if (!participant) return [];

    const relatedUserArchives = Array.from(archiveIdsByParticipantId.get(participantId) ?? [])
      .flatMap((archiveId) => userArchivesById.get(archiveId) ?? [])
      .sort((left, right) => right.sortAt.localeCompare(left.sortAt));
    const systemArchive = systemArchiveByParticipantId.get(participantId);

    return [{
      archives: systemArchive ? [systemArchive, ...relatedUserArchives] : relatedUserArchives,
      participant: {
        id: participant.id,
        rpName: participant.rp_name,
        streamerName: participant.streamer.name,
      },
    }];
  });
}

const ARCHIVE_PEOPLE_PAGE_SIZE = 12;

export async function getArchivePeoplePage(
  filters: ArchivePeopleFilters,
  cursor: string | null,
  limit = ARCHIVE_PEOPLE_PAGE_SIZE,
): Promise<ArchivePeoplePage> {
  const supabase = getSupabaseAdminClient();
  const seasonId = await getArchivePeopleSeasonId();
  const participantIds = await resolveArchivePeopleParticipantIds(supabase, seasonId, filters);

  if (participantIds?.length === 0) {
    return { items: [], nextCursor: null };
  }

  let query = supabase
    .from("season_participants")
    .select("id")
    .eq("season_id", seasonId)
    .order("id", { ascending: true })
    .limit(limit + 1);

  if (participantIds) {
    query = query.in("id", participantIds);
  }

  if (cursor) {
    query = query.gt("id", cursor);
  }

  const result = await query;

  if (result.error) {
    throw new ArchiveRequestError("인물별 아카이브를 불러오지 못했습니다.", 500, {
      cause: result.error,
    });
  }

  const rows = result.data.slice(0, limit);
  const items = await getArchivePeopleSections(rows.map((participant) => participant.id));

  return {
    items,
    nextCursor: result.data.length > limit ? rows.at(-1)?.id ?? null : null,
  };
}

async function getArchivePeopleSeasonId(): Promise<number> {
  const result = await getSupabaseAdminClient()
    .from("seasons")
    .select("id")
    .eq("is_active", true)
    .limit(2);

  if (result.error || result.data.length !== 1) {
    throw new ArchiveRequestError("활성 시즌을 확인하지 못했습니다.", 500, {
      cause: result.error ?? undefined,
    });
  }

  return result.data[0].id;
}

async function resolveArchivePeopleParticipantIds(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  seasonId: number,
  filters: ArchivePeopleFilters,
): Promise<string[] | null> {
  const candidateSets = await Promise.all([
    resolveArchivePeopleQueryIds(supabase, seasonId, filters.query),
    resolveArchivePeopleJobIds(supabase, seasonId, filters.jobs),
    resolveArchivePeopleAffiliationIds(supabase, seasonId, filters.affiliations),
  ]);
  const appliedSets = candidateSets.filter((candidateSet): candidateSet is string[] => candidateSet !== null);

  if (appliedSets.length === 0) return null;

  const [firstSet, ...remainingSets] = appliedSets;
  const matchedIds = new Set(firstSet);

  for (const candidateSet of remainingSets) {
    const candidateIdSet = new Set(candidateSet);
    for (const participantId of matchedIds) {
      if (!candidateIdSet.has(participantId)) {
        matchedIds.delete(participantId);
      }
    }
  }

  return Array.from(matchedIds);
}

async function resolveArchivePeopleQueryIds(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  seasonId: number,
  rawQuery: string,
): Promise<string[] | null> {
  if (!rawQuery) return null;

  const [participantResult, streamerResult] = await Promise.all([
    supabase
      .from("season_participants")
      .select("id")
      .eq("season_id", seasonId)
      .ilike("rp_name", `%${rawQuery}%`),
    supabase
      .from("streamers")
      .select("id")
      .ilike("name", `%${rawQuery}%`),
  ]);

  if (participantResult.error || streamerResult.error) {
    throw new ArchiveRequestError("인물 검색 조건을 확인하지 못했습니다.", 500, {
      cause: participantResult.error ?? streamerResult.error ?? undefined,
    });
  }

  const streamerIds = streamerResult.data.map((streamer) => streamer.id);
  const streamerParticipantResult = streamerIds.length === 0
    ? { data: [] as Array<{ id: string }>, error: null }
    : await supabase
      .from("season_participants")
      .select("id")
      .eq("season_id", seasonId)
      .in("streamer_id", streamerIds);

  if (streamerParticipantResult.error) {
    throw new ArchiveRequestError("인물 검색 조건을 확인하지 못했습니다.", 500, {
      cause: streamerParticipantResult.error,
    });
  }

  return Array.from(new Set([
    ...participantResult.data.map((participant) => participant.id),
    ...streamerParticipantResult.data.map((participant) => participant.id),
  ]));
}

const JOB_CATEGORY_ORGANIZATION_TYPES: Record<string, string[]> = {
  "public-service": ["institution", "public-service"],
  business: ["business"],
  "illegal-business": ["illegal-business"],
  gang: ["gang"],
  crew: ["crew"],
};

async function resolveArchivePeopleJobIds(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  seasonId: number,
  jobs: string[],
): Promise<string[] | null> {
  if (jobs.length === 0) return null;

  const organizationTypes = jobs.flatMap((job) => JOB_CATEGORY_ORGANIZATION_TYPES[job] ?? []);
  const organizationSlugs = jobs.filter((job) => JOB_CATEGORY_ORGANIZATION_TYPES[job] === undefined);
  const organizationResults = await Promise.all([
    organizationSlugs.length > 0
      ? supabase.from("organizations").select("id").eq("season_id", seasonId).in("slug", organizationSlugs)
      : Promise.resolve({ data: [] as Array<{ id: string }>, error: null }),
    organizationTypes.length > 0
      ? supabase.from("organizations").select("id").eq("season_id", seasonId).in("type", organizationTypes)
      : Promise.resolve({ data: [] as Array<{ id: string }>, error: null }),
  ]);
  const organizationError = organizationResults.find((result) => result.error)?.error;

  if (organizationError) {
    throw new ArchiveRequestError("직업 조건을 확인하지 못했습니다.", 500, {
      cause: organizationError,
    });
  }

  const organizationIds = Array.from(new Set(
    organizationResults.flatMap((result) => (result.data ?? []).map((organization) => organization.id)),
  ));

  if (organizationIds.length === 0) return [];

  const membershipsResult = await supabase
    .from("organization_memberships")
    .select("id, participant_id")
    .in("organization_id", organizationIds);

  if (membershipsResult.error) {
    throw new ArchiveRequestError("직업 조건을 확인하지 못했습니다.", 500, {
      cause: membershipsResult.error,
    });
  }

  if (membershipsResult.data.length === 0) return [];

  const roleHistoriesResult = await supabase
    .from("organization_role_histories")
    .select("membership_id")
    .in("membership_id", membershipsResult.data.map((membership) => membership.id))
    .is("end_date", null);

  if (roleHistoriesResult.error) {
    throw new ArchiveRequestError("직업 조건을 확인하지 못했습니다.", 500, {
      cause: roleHistoriesResult.error,
    });
  }

  const activeMembershipIds = new Set(roleHistoriesResult.data.map((history) => history.membership_id));
  return membershipsResult.data
    .filter((membership) => activeMembershipIds.has(membership.id))
    .map((membership) => membership.participant_id);
}

async function resolveArchivePeopleAffiliationIds(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  seasonId: number,
  affiliations: string[],
): Promise<string[] | null> {
  if (affiliations.length === 0) return null;

  const affiliationsResult = await supabase
    .from("streamer_affiliations")
    .select("id, slug, parent_affiliation_id");

  if (affiliationsResult.error) {
    throw new ArchiveRequestError("소속 조건을 확인하지 못했습니다.", 500, {
      cause: affiliationsResult.error,
    });
  }

  const selectedAffiliationIds = resolveSelectedAffiliationIds(
    affiliationsResult.data,
    affiliations,
  );

  if (selectedAffiliationIds.length === 0) return [];

  const membershipsResult = await supabase
    .from("streamer_affiliation_memberships")
    .select("streamer_id")
    .in("affiliation_id", selectedAffiliationIds);

  if (membershipsResult.error) {
    throw new ArchiveRequestError("소속 조건을 확인하지 못했습니다.", 500, {
      cause: membershipsResult.error,
    });
  }

  const streamerIds = Array.from(new Set(membershipsResult.data.map((membership) => membership.streamer_id)));
  if (streamerIds.length === 0) return [];

  const participantsResult = await supabase
    .from("season_participants")
    .select("id")
    .eq("season_id", seasonId)
    .in("streamer_id", streamerIds);

  if (participantsResult.error) {
    throw new ArchiveRequestError("소속 조건을 확인하지 못했습니다.", 500, {
      cause: participantsResult.error,
    });
  }

  return participantsResult.data.map((participant) => participant.id);
}

function resolveSelectedAffiliationIds(
  affiliations: Array<{ id: string; parent_affiliation_id: string | null; slug: string }>,
  selectedSlugs: string[],
): string[] {
  const affiliationsBySlug = new Map(affiliations.map((affiliation) => [affiliation.slug, affiliation]));
  const childrenByParentId = new Map<string, string[]>();

  for (const affiliation of affiliations) {
    if (!affiliation.parent_affiliation_id) continue;

    const children = childrenByParentId.get(affiliation.parent_affiliation_id) ?? [];
    children.push(affiliation.id);
    childrenByParentId.set(affiliation.parent_affiliation_id, children);
  }

  const selectedIds = new Set<string>();
  const addDescendants = (affiliationId: string) => {
    if (selectedIds.has(affiliationId)) return;

    selectedIds.add(affiliationId);
    for (const childId of childrenByParentId.get(affiliationId) ?? []) {
      addDescendants(childId);
    }
  };

  for (const slug of selectedSlugs) {
    const affiliation = affiliationsBySlug.get(slug);
    if (affiliation) addDescendants(affiliation.id);
  }

  return Array.from(selectedIds);
}

interface ArchivePeopleClipRow {
  clip_created_at: string;
  season_participant_id: string;
  thumbnail_url: string | null;
}

async function getArchivePeopleClips(participantIds: string[]): Promise<ArchivePeopleClipRow[]> {
  const supabase = getSupabaseAdminClient();
  const rows: ArchivePeopleClipRow[] = [];
  const pageSize = 1_000;

  for (let from = 0; ; from += pageSize) {
    const result = await supabase
      .from("clips")
      .select("season_participant_id, clip_created_at, thumbnail_url")
      .in("season_participant_id", participantIds)
      .is("excluded_at", null)
      .order("clip_created_at", { ascending: false })
      .range(from, from + pageSize - 1);

    if (result.error) {
      throw new ArchiveRequestError("인물별 클립 정보를 불러오지 못했습니다.", 500, {
        cause: result.error,
      });
    }

    rows.push(...result.data.flatMap((clip) => (
      clip.season_participant_id === null ? [] : [{
        clip_created_at: clip.clip_created_at,
        season_participant_id: clip.season_participant_id,
        thumbnail_url: clip.thumbnail_url,
      }]
    )));
    if (result.data.length < pageSize) break;
  }

  return rows;
}

function getClipStatsByParticipant(clips: ArchivePeopleClipRow[]) {
  const stats = new Map<string, {
    clipCount: number;
    firstClipCreatedAt: string;
    lastClipCreatedAt: string;
    representativeImageUrl: string | null;
  }>();

  for (const clip of clips) {
    const existing = stats.get(clip.season_participant_id);

    if (!existing) {
      stats.set(clip.season_participant_id, {
        clipCount: 1,
        firstClipCreatedAt: clip.clip_created_at,
        lastClipCreatedAt: clip.clip_created_at,
        representativeImageUrl: clip.thumbnail_url,
      });
      continue;
    }

    existing.clipCount += 1;
    existing.firstClipCreatedAt = existing.firstClipCreatedAt < clip.clip_created_at
      ? existing.firstClipCreatedAt
      : clip.clip_created_at;
    existing.lastClipCreatedAt = existing.lastClipCreatedAt > clip.clip_created_at
      ? existing.lastClipCreatedAt
      : clip.clip_created_at;
    existing.representativeImageUrl ??= clip.thumbnail_url;
  }

  return stats;
}

async function getArchivePeopleUserArchives(archiveIds: string[]): Promise<ArchiveListItem[]> {
  if (archiveIds.length === 0) return [];

  const supabase = getSupabaseAdminClient();
  const [archivesResult, itemsResult] = await Promise.all([
    supabase
      .from("archives")
      .select("id, category, description, published_at, status, title, updated_at")
      .in("id", archiveIds)
      .eq("archive_kind", "user")
      .eq("visibility", "public")
      .is("deleted_at", null),
    supabase
      .from("archive_items")
      .select("archive_id, clip:clips!inner(clip_created_at, thumbnail_url)")
      .in("archive_id", archiveIds),
  ]);

  if (archivesResult.error || itemsResult.error) {
    throw new ArchiveRequestError("관련 공개 아카이브를 불러오지 못했습니다.", 500, {
      cause: archivesResult.error ?? itemsResult.error ?? undefined,
    });
  }

  const statsByArchiveId = new Map<string, {
    clipCount: number;
    firstClipCreatedAt: string;
    lastClipCreatedAt: string;
    representativeImageUrl: string | null;
  }>();

  for (const item of itemsResult.data) {
    const existing = statsByArchiveId.get(item.archive_id);
    if (!existing) {
      statsByArchiveId.set(item.archive_id, {
        clipCount: 1,
        firstClipCreatedAt: item.clip.clip_created_at,
        lastClipCreatedAt: item.clip.clip_created_at,
        representativeImageUrl: item.clip.thumbnail_url,
      });
      continue;
    }

    existing.clipCount += 1;
    existing.firstClipCreatedAt = existing.firstClipCreatedAt < item.clip.clip_created_at
      ? existing.firstClipCreatedAt
      : item.clip.clip_created_at;
    existing.lastClipCreatedAt = existing.lastClipCreatedAt > item.clip.clip_created_at
      ? existing.lastClipCreatedAt
      : item.clip.clip_created_at;
    existing.representativeImageUrl ??= item.clip.thumbnail_url;
  }

  return archivesResult.data.map((archive) => {
    const stats = statsByArchiveId.get(archive.id);

    return {
      archiveKind: "user" as const,
      category: toArchiveCategory(archive.category),
      clipCount: stats?.clipCount ?? 0,
      description: archive.description,
      firstClipCreatedAt: stats?.firstClipCreatedAt ?? null,
      id: archive.id,
      lastClipCreatedAt: stats?.lastClipCreatedAt ?? null,
      ownerName: null,
      publishedAt: archive.published_at,
      representativeImageUrl: stats?.representativeImageUrl ?? null,
      sortAt: archive.updated_at,
      status: toArchiveStatus(archive.status),
      systemParticipant: null,
      title: archive.title,
      updatedAt: archive.updated_at,
    };
  });
}

async function getMyArchiveDisplayDetails(archiveIds: string[]): Promise<Map<string, {
  description: string | null;
  representativeImageUrl: string | null;
}>> {
  if (archiveIds.length === 0) {
    return new Map();
  }

  const supabase = getSupabaseAdminClient();
  const [archivesResult, archiveItemsResult] = await Promise.all([
    supabase
      .from("archives")
      .select("id, description")
      .in("id", archiveIds),
    supabase
      .from("archive_items")
      .select(`
        archive_id,
        clip:clips!inner (
          thumbnail_url
        )
      `)
      .in("archive_id", archiveIds),
  ]);

  if (archivesResult.error || archiveItemsResult.error) {
    throw new ArchiveRequestError("내 아카이브를 불러오지 못했습니다.", 500, {
      cause: archivesResult.error ?? archiveItemsResult.error ?? undefined,
    });
  }

  const detailsByArchiveId = new Map<string, {
    description: string | null;
    representativeImageUrl: string | null;
  }>((archivesResult.data ?? []).map((archive) => [archive.id, {
    description: archive.description,
    representativeImageUrl: null,
  }]));

  for (const item of archiveItemsResult.data ?? []) {
    const detail = detailsByArchiveId.get(item.archive_id);

    if (detail && detail.representativeImageUrl === null && item.clip?.thumbnail_url) {
      detail.representativeImageUrl = item.clip.thumbnail_url;
    }
  }

  return detailsByArchiveId;
}

export async function getMyArchivePage(
  user: AuthenticatedUser,
  tab: MyArchiveTab,
  cursor: MyArchiveCursor | null,
): Promise<MyArchivePage> {
  const supabase = getSupabaseAdminClient();
  const result = await supabase.rpc("get_my_archive_page", {
    p_actor_user_id: user.id,
    p_cursor_at: cursor?.sortAt,
    p_cursor_id: cursor?.id,
    p_limit: MY_ARCHIVE_LIST_PAGE_SIZE + 1,
    p_tab: tab,
  });

  if (result.error) {
    throw new ArchiveRequestError("내 아카이브를 불러오지 못했습니다.", 500, {
      cause: result.error,
    });
  }

  const rows = result.data;
  const items = rows
    .slice(0, MY_ARCHIVE_LIST_PAGE_SIZE)
    .map((row) => toMyArchiveListItem(row, tab, user));
  const displayDetailsByArchiveId = await getMyArchiveDisplayDetails(items.map((item) => item.id));
  const displayItems = items.map((item) => ({
    ...item,
    description: displayDetailsByArchiveId.get(item.id)?.description ?? null,
    representativeImageUrl: displayDetailsByArchiveId.get(item.id)?.representativeImageUrl ?? null,
  }));
  const lastItem = displayItems.at(-1);

  return {
    items: displayItems,
    nextCursor: rows.length > MY_ARCHIVE_LIST_PAGE_SIZE && lastItem
      ? { id: lastItem.id, sortAt: lastItem.sortAt }
      : null,
  };
}

export async function getArchiveDetail(
  archiveId: string,
  viewer: AuthenticatedUser | null,
): Promise<ArchiveDetail | null> {
  const supabase = getSupabaseAdminClient();
  const archiveResult = await supabase
    .from("archives")
    .select(`
      id,
      owner_id,
      season_id,
      archive_kind,
      structure_mode,
      system_participant_id,
      title,
      description,
      category,
      visibility,
      edit_policy,
      status,
      current_revision,
      updated_at,
      deleted_at,
      owner:users!archives_owner_id_fkey (
        chzzk_channel_name
      ),
      system_participant:season_participants!archives_system_participant_same_season_fkey (
        id,
        rp_name,
        streamer:streamers!inner (
          name
        )
      )
    `)
    .eq("id", archiveId)
    .maybeSingle();

  if (archiveResult.error) {
    throw new ArchiveRequestError("아카이브를 불러오지 못했습니다.", 500, {
      cause: archiveResult.error,
    });
  }

  const archive = archiveResult.data;

  if (
    !archive ||
    archive.deleted_at !== null ||
    (archive.visibility === "private" && archive.owner_id !== viewer?.id)
  ) {
    return null;
  }

  const [chaptersResult, itemsResult, dayRelationsResult, participantRelationsResult] = await Promise.all([
    supabase
      .from("archive_chapters")
      .select(`
        id,
        title,
        description,
        sort_order,
        season_day_id,
        story_type,
        season_day:season_days!archive_chapters_season_day_id_fkey (
          id,
          day_number,
          session_date
        )
      `)
      .eq("archive_id", archive.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("archive_items")
      .select("id, chapter_id, clip_id, note, sort_order")
      .eq("archive_id", archive.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("archive_day_relations")
      .select(`
        season_day:season_days!archive_day_relations_day_same_season_fkey (
          id,
          day_number,
          session_date
        )
      `)
      .eq("archive_id", archive.id),
    supabase
      .from("archive_participant_relations")
      .select(`
        participant:season_participants!archive_participant_relations_participant_same_season_fkey (
          id,
          rp_name,
          streamer:streamers!inner (
            name
          )
        )
      `)
      .eq("archive_id", archive.id),
  ]);

  if (
    chaptersResult.error ||
    itemsResult.error ||
    dayRelationsResult.error ||
    participantRelationsResult.error
  ) {
    throw new ArchiveRequestError("아카이브 콘텐츠를 불러오지 못했습니다.", 500, {
      cause: chaptersResult.error ?? itemsResult.error ?? dayRelationsResult.error ?? participantRelationsResult.error,
    });
  }

  const clipIds = itemsResult.data.map((item) => item.clip_id);
  const clipsResult = clipIds.length > 0
    ? await createArchiveClipSummaryQuery().in("id", clipIds)
    : { data: [], error: null };

  if (clipsResult.error) {
    throw new ArchiveRequestError("아카이브 클립을 불러오지 못했습니다.", 500, {
      cause: clipsResult.error,
    });
  }

  const clipsById = new Map(
    clipsResult.data.map((clip) => [clip.id, toArchiveClipSummary(clip)]),
  );

  const itemsByChapterId = new Map<string, ArchiveDetail["chapters"][number]["items"]>();

  for (const item of itemsResult.data) {
    const clip = clipsById.get(item.clip_id);

    if (!clip) {
      throw new ArchiveRequestError("아카이브 클립 정보가 올바르지 않습니다.", 500);
    }

    const items = itemsByChapterId.get(item.chapter_id) ?? [];
    items.push({
      clip,
      clipId: item.clip_id,
      id: item.id,
      note: item.note,
      sortOrder: item.sort_order,
    });
    itemsByChapterId.set(item.chapter_id, items);
  }

  return {
    category: toArchiveCategory(archive.category),
    archiveKind: toArchiveKind(archive.archive_kind),
    canEditContent: canEditArchiveContent({
      archiveKind: archive.archive_kind,
      deletedAt: archive.deleted_at,
      editPolicy: archive.edit_policy,
      ownerId: archive.owner_id,
      visibility: archive.visibility,
    }, viewer),
    canEditMetadata: archive.archive_kind === "user" && archive.owner_id === viewer?.id && viewer?.status === "active",
    chapters: chaptersResult.data.map((chapter) => ({
      description: chapter.description,
      id: chapter.id,
      items: itemsByChapterId.get(chapter.id) ?? [],
      seasonDayId: chapter.season_day_id,
      seasonDay: chapter.season_day
        ? {
            dayNumber: chapter.season_day.day_number,
            id: chapter.season_day.id,
            sessionDate: chapter.season_day.session_date,
          }
        : null,
      sortOrder: chapter.sort_order,
      storyType: toArchiveStoryType(chapter.story_type),
      title: chapter.title,
    })),
    currentRevision: archive.current_revision,
    creatorName: archive.owner?.chzzk_channel_name ?? null,
    description: archive.description,
    editPolicy: toArchiveEditPolicy(archive.edit_policy),
    id: archive.id,
    isOwner: archive.owner_id === viewer?.id,
    relatedParticipants: participantRelationsResult.data
      .map((relation) => relation.participant)
      .filter((participant) => participant !== null)
      .map((participant) => ({
        id: participant.id,
        rpName: participant.rp_name,
        streamerName: participant.streamer.name,
      }))
      .sort((left, right) => (left.rpName ?? left.streamerName).localeCompare(
        right.rpName ?? right.streamerName,
        "ko",
      )),
    relatedSeasonDays: dayRelationsResult.data
      .map((relation) => relation.season_day)
      .filter((seasonDay) => seasonDay !== null)
      .map((seasonDay) => ({
        dayNumber: seasonDay.day_number,
        id: seasonDay.id,
        sessionDate: seasonDay.session_date,
      }))
      .sort((left, right) => left.dayNumber - right.dayNumber),
    seasonId: archive.season_id,
    status: toArchiveStatus(archive.status),
    structureMode: toArchiveStructureMode(archive.structure_mode),
    systemParticipant: archive.system_participant
      ? {
          id: archive.system_participant.id,
          rpName: archive.system_participant.rp_name,
          streamerName: archive.system_participant.streamer.name,
        }
      : null,
    title: archive.title,
    updatedAt: archive.updated_at,
    visibility: toArchiveVisibility(archive.visibility),
  };
}

export async function getArchiveEditorOptions(): Promise<ArchiveEditorOptions> {
  const supabase = getSupabaseAdminClient();
  const seasonResult = await supabase
    .from("seasons")
    .select("id")
    .eq("is_active", true)
    .limit(2);

  if (seasonResult.error || seasonResult.data.length !== 1) {
    throw new ArchiveRequestError("현재 시즌 정보를 불러오지 못했습니다.", 500, {
      cause: seasonResult.error ?? undefined,
    });
  }

  const seasonId = seasonResult.data[0].id;
  const seasonDaysResult = await supabase
    .from("season_days")
    .select("id, day_number, session_date, starts_at, ends_at")
    .eq("season_id", seasonId)
    .order("day_number", { ascending: true });

  if (seasonDaysResult.error) {
    throw new ArchiveRequestError("봉누도 일차를 불러오지 못했습니다.", 500, {
      cause: seasonDaysResult.error,
    });
  }

  return {
    seasonDays: seasonDaysResult.data.map((seasonDay) => ({
      dayNumber: seasonDay.day_number,
      endsAt: seasonDay.ends_at,
      id: seasonDay.id,
      sessionDate: seasonDay.session_date,
      startsAt: seasonDay.starts_at,
    })),
    seasonId,
  };
}

export async function getSystemArchiveClipPage(
  archiveId: string,
  dayNumber: number | null,
  cursor: ClipCursor | null,
  sort: ClipSort,
): Promise<ClipPage | null> {
  const supabase = getSupabaseAdminClient();
  const archiveResult = await supabase
    .from("archives")
    .select("archive_kind, deleted_at, season_id, system_participant_id, visibility")
    .eq("id", archiveId)
    .maybeSingle();

  if (archiveResult.error) {
    throw new ArchiveRequestError("아카이브를 불러오지 못했습니다.", 500, {
      cause: archiveResult.error,
    });
  }

  const archive = archiveResult.data;

  if (
    !archive ||
    archive.archive_kind !== "system_character" ||
    archive.deleted_at !== null ||
    archive.visibility !== "public" ||
    archive.system_participant_id === null
  ) {
    return null;
  }

  let seasonDayId: string | null = null;

  if (dayNumber !== null) {
    const seasonDayResult = await supabase
      .from("season_days")
      .select("id")
      .eq("season_id", archive.season_id)
      .eq("day_number", dayNumber)
      .maybeSingle();

    if (seasonDayResult.error) {
      throw new ArchiveRequestError("봉누도 일차를 확인하지 못했습니다.", 500, {
        cause: seasonDayResult.error,
      });
    }

    if (!seasonDayResult.data) {
      return { items: [], nextCursor: null };
    }

    seasonDayId = seasonDayResult.data.id;
  }

  return getClipPageForArchiveParticipant(
    archive.season_id,
    archive.system_participant_id,
    seasonDayId,
    cursor,
    sort,
  );
}

export async function getSystemArchiveClipNeighbors(
  archiveId: string,
  clipId: string,
  dayNumber: number | null,
  sort: ClipSort,
): Promise<ClipPage["items"] | null> {
  const supabase = getSupabaseAdminClient();
  const archiveResult = await supabase
    .from("archives")
    .select("archive_kind, deleted_at, season_id, system_participant_id, visibility")
    .eq("id", archiveId)
    .maybeSingle();

  if (archiveResult.error) {
    throw new ArchiveRequestError("아카이브를 불러오지 못했습니다.", 500, {
      cause: archiveResult.error,
    });
  }

  const archive = archiveResult.data;

  if (
    !archive ||
    archive.archive_kind !== "system_character" ||
    archive.deleted_at !== null ||
    archive.visibility !== "public" ||
    archive.system_participant_id === null
  ) {
    return null;
  }

  let seasonDayId: string | null = null;

  if (dayNumber !== null) {
    const seasonDayResult = await supabase
      .from("season_days")
      .select("id")
      .eq("season_id", archive.season_id)
      .eq("day_number", dayNumber)
      .maybeSingle();

    if (seasonDayResult.error) {
      throw new ArchiveRequestError("봉누도 일차를 확인하지 못했습니다.", 500, {
        cause: seasonDayResult.error,
      });
    }

    if (!seasonDayResult.data) {
      return [];
    }

    seasonDayId = seasonDayResult.data.id;
  }

  return getClipNeighborsForArchiveParticipant(
    archive.season_id,
    archive.system_participant_id,
    seasonDayId,
    clipId,
    sort,
  );
}

export async function getSystemArchiveClipSummary(
  archiveId: string,
): Promise<ArchiveSystemClipSummary | null> {
  const supabase = getSupabaseAdminClient();
  const result = await supabase.rpc("get_system_archive_clip_summary", {
    p_archive_id: archiveId,
  });

  if (result.error) {
    throw new ArchiveRequestError("시스템 아카이브 정보를 불러오지 못했습니다.", 500, {
      cause: result.error,
    });
  }

  const summaryRows = result.data;

  if (summaryRows.length === 0) {
    return null;
  }

  const first = summaryRows[0];

  return {
    clipCount: Number(first.clip_count),
    firstClipCreatedAt: first.first_clip_created_at,
    lastClipCreatedAt: first.last_clip_created_at,
    seasonDays: summaryRows.flatMap((row) =>
      row.season_day_id === null || row.day_number === null || row.session_date === null
        ? []
        : [{
            dayNumber: row.day_number,
            id: row.season_day_id,
            sessionDate: row.session_date,
          }],
    ),
  };
}

function parseArchiveRequest<T>(schema: { safeParse: (value: unknown) => { data: T; success: true } | { error: { issues: Array<{ message: string }> }; success: false } }, value: unknown): T {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new ArchiveRequestError(result.error.issues[0]?.message ?? "아카이브 요청이 올바르지 않습니다.");
  }

  return result.data;
}

function toArchiveSaveResult(
  data: Array<{ archive_id: string; current_revision: number; snapshot: Json }> | null,
  error: ArchiveRpcError | null,
): ArchiveSaveResult {
  if (error) {
    throwArchiveRpcError(error);
  }

  const saved = data?.[0];

  if (!saved) {
    throw new ArchiveRequestError("아카이브를 저장하지 못했습니다.", 500);
  }

  return {
    archiveId: saved.archive_id,
    currentRevision: saved.current_revision,
    snapshot: parseArchiveSnapshot(saved.snapshot),
  };
}

function toArchiveContentJson(content: ReturnType<typeof toArchiveContentInput>): Json {
  return {
    chapters: content.chapters.map((chapter) => ({
      description: chapter.description,
      items: chapter.items.map((item) => ({
        clipId: item.clipId,
        note: item.note,
      })),
      seasonDayId: chapter.seasonDayId,
      storyType: chapter.storyType,
      title: chapter.title,
    })),
  };
}

function toArchiveMetadataJson(metadata: ReturnType<typeof toArchiveMetadataInput>): Json {
  return {
    category: metadata.category,
    description: metadata.description,
    editPolicy: metadata.editPolicy,
    relatedParticipantIds: metadata.relatedParticipantIds,
    relatedSeasonDayIds: metadata.relatedSeasonDayIds,
    status: metadata.status,
    structureMode: metadata.structureMode,
    title: metadata.title,
    visibility: metadata.visibility,
  };
}

function throwArchiveRpcError(error: ArchiveRpcError): never {
  switch (error.message) {
    case "archive_not_found":
    case "archive_revision_not_found":
      throw new ArchiveRequestError("아카이브를 찾을 수 없습니다.", 404, { cause: error });
    case "archive_content_forbidden":
    case "archive_metadata_forbidden":
    case "archive_user_not_active":
      throw new ArchiveRequestError("아카이브를 수정할 권한이 없습니다.", 403, { cause: error });
    case "archive_revision_conflict":
      throw new ArchiveRequestError(
        "다른 사용자가 먼저 수정했습니다. 최신 내용을 다시 불러온 뒤 확인해주세요.",
        409,
        { cause: error },
      );
    case "archive_cannot_be_private_after_publication":
      throw new ArchiveRequestError("공개한 아카이브는 비공개로 변경할 수 없습니다.", 400, {
        cause: error,
      });
    case "archive_restore_window_expired":
      throw new ArchiveRequestError("삭제 후 30일이 지난 아카이브는 복구할 수 없습니다.", 400, {
        cause: error,
      });
    case "archive_deleted":
      throw new ArchiveRequestError("삭제된 아카이브입니다.", 404, { cause: error });
    case "system_archive_read_only":
      throw new ArchiveRequestError("시스템 아카이브는 수정할 수 없습니다.", 403, { cause: error });
    case "archive_duplicate_clip":
      throw new ArchiveRequestError("같은 클립을 중복해서 추가할 수 없습니다.", 400, {
        cause: error,
      });
    case "archive_clip_season_mismatch":
      throw new ArchiveRequestError("아카이브와 다른 시즌의 클립은 추가할 수 없습니다.", 400, {
        cause: error,
      });
    case "archive_day_based_clip_mismatch":
      throw new ArchiveRequestError("클립의 봉누도 일차와 챕터 일차가 일치하지 않습니다.", 400, {
        cause: error,
      });
    case "archive_character_participant_required":
      throw new ArchiveRequestError("인물 아카이브는 관련 인물을 한 명 이상 선택해주세요.", 400, {
        cause: error,
      });
    case "archive_incident_day_required":
      throw new ArchiveRequestError("사건 아카이브는 관련 일차를 한 개 이상 선택해주세요.", 400, {
        cause: error,
      });
    case "archive_relation_season_mismatch":
      throw new ArchiveRequestError("현재 시즌에 속한 일차와 인물만 선택할 수 있습니다.", 400, {
        cause: error,
      });
    default:
      throw new ArchiveRequestError("아카이브를 저장하지 못했습니다.", 500, {
        cause: error,
      });
  }
}

function toArchiveClipSummary(row: ArchiveClipSummaryRow) {
  return {
    clipCreatedAt: row.clip_created_at,
    clipUrl: row.clip_url,
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
  };
}

function toMyArchiveListItem(
  row: MyArchivePageRow,
  tab: MyArchiveTab,
  user: AuthenticatedUser,
): MyArchiveListItem {
  const deletedAt = row.deleted_at;
  const lastEditedByMeAt = row.last_edited_by_me_at;
  const sortAt = getMyArchiveSortAt(row, tab);

  return {
    canEditContent: canEditArchiveContent({
      archiveKind: "user",
      deletedAt,
      editPolicy: row.edit_policy,
      ownerId: tab === "owned" || tab === "deleted" ? user.id : null,
      visibility: row.visibility,
    }, user),
    canRestore: row.can_restore && user.status === "active",
    clipCount: Number(row.clip_count),
    currentRevision: row.current_revision,
    deletedAt,
    description: null,
    editPolicy: toArchiveEditPolicy(row.edit_policy),
    id: row.archive_id,
    lastEditedByMeAt,
    ownerName: row.owner_name,
    representativeImageUrl: null,
    restoreExpiresAt: row.restore_expires_at,
    sortAt,
    status: toArchiveStatus(row.status),
    structureMode: toMyArchiveStructureMode(row.structure_mode),
    title: row.title,
    updatedAt: row.updated_at,
    visibility: toArchiveVisibility(row.visibility),
  };
}

function getMyArchiveSortAt(row: MyArchivePageRow, tab: MyArchiveTab): string {
  if (tab === "owned") {
    return row.updated_at;
  }

  if (tab === "edited" && row.last_edited_by_me_at) {
    return row.last_edited_by_me_at;
  }

  if (tab === "deleted" && row.deleted_at) {
    return row.deleted_at;
  }

  throw new ArchiveRequestError("내 아카이브 정렬 정보가 올바르지 않습니다.", 500);
}

function toArchiveListItem(row: PublicArchivePageRow): ArchiveListItem {
  const archiveKind = toArchiveKind(row.archive_kind);
  const systemParticipant = row.system_participant_id && row.system_participant_streamer_name
    ? {
        id: row.system_participant_id,
        profileImageUrl: getR2PublicUrl(row.system_participant_profile_image_key),
        rpName: row.system_participant_rp_name,
        streamerName: row.system_participant_streamer_name,
      }
    : null;
  const profileImageUrl = archiveKind === "system_character"
    ? systemParticipant?.profileImageUrl ?? null
    : null;

  return {
    archiveKind,
    category: toArchiveCategory(row.category),
    clipCount: Number(row.clip_count),
    description: row.description,
    firstClipCreatedAt: row.first_clip_created_at,
    id: row.archive_id,
    lastClipCreatedAt: row.last_clip_created_at,
    ownerName: row.owner_name,
    publishedAt: row.published_at,
    representativeImageUrl: profileImageUrl ?? row.representative_thumbnail_url,
    sortAt: row.sort_at,
    status: toArchiveStatus(row.status),
    systemParticipant,
    title: row.title,
    updatedAt: row.updated_at,
  };
}

function toArchiveCategory(value: string): ArchiveCategory {
  if (value === "character" || value === "incident" || value === "series" || value === "other") {
    return value;
  }

  throw new ArchiveRequestError("아카이브 정보가 올바르지 않습니다.", 500);
}

function toArchiveKind(value: string): ArchiveKind {
  if (value === "system_character" || value === "user") {
    return value;
  }

  throw new ArchiveRequestError("아카이브 정보가 올바르지 않습니다.", 500);
}

function toArchiveEditPolicy(value: string): ArchiveEditPolicy {
  if (value === "owner_only" || value === "public_edit") {
    return value;
  }

  throw new ArchiveRequestError("아카이브 정보가 올바르지 않습니다.", 500);
}

function toArchiveStatus(value: string): ArchiveStatus {
  if (value === "ongoing" || value === "completed") {
    return value;
  }

  throw new ArchiveRequestError("아카이브 정보가 올바르지 않습니다.", 500);
}

function toArchiveStructureMode(value: string | null): ArchiveStructureMode | null {
  if (value === null || value === "day_based" || value === "freeform") {
    return value;
  }

  throw new ArchiveRequestError("아카이브 정보가 올바르지 않습니다.", 500);
}

function toArchiveStoryType(value: string): ArchiveStoryType {
  if (value === "main" || value === "side") {
    return value;
  }

  throw new ArchiveRequestError("아카이브 챕터 정보가 올바르지 않습니다.", 500);
}

function toMyArchiveStructureMode(value: string | null): ArchiveStructureMode {
  const structureMode = toArchiveStructureMode(value);

  if (structureMode === null) {
    throw new ArchiveRequestError("내 아카이브 구성 정보가 올바르지 않습니다.", 500);
  }

  return structureMode;
}

function toArchiveVisibility(value: string): ArchiveVisibility {
  if (value === "private" || value === "public") {
    return value;
  }

  throw new ArchiveRequestError("아카이브 정보가 올바르지 않습니다.", 500);
}
