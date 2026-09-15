import type { QueryData } from "@supabase/supabase-js";

import {
  getOrderedAffiliations,
  getOrderedStreamerAffiliations,
  type CharacterAffiliation,
  type CharacterAffiliationCategory,
  type CharacterDirectoryData,
  type CharacterListItem,
  type CharacterRoleHistory,
  type StreamerAffiliation,
  type CharacterStreamerAffiliation,
  type CharacterStreamerAffiliationType,
} from "@/features/characters/character";
import { getR2PublicUrl } from "@/lib/r2";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const BONGNUDO2_SEASON_SLUG = "bongnudo-2";

function createCharactersQuery() {
  return getSupabaseBrowserClient()
    .from("season_participants")
    .select(`
      id,
      rp_name,
      birth_date,
      stated_age,
      full_body_image_key,
      portrait_image_key,
      seasons!season_participants_season_id_fkey!inner (),
      streamer:streamers!inner (
        id,
        slug,
        name,
        chzzk_channel_id,
        profile_image_key,
        affiliation_memberships:streamer_affiliation_memberships (
          id,
          sort_order,
          affiliation:streamer_affiliations!inner (
            id,
            slug,
            name,
            type
          )
        )
      ),
      memberships:organization_memberships (
        id,
        is_primary,
        display_order,
        organization:organizations!inner (
          id,
          slug,
          name,
          type
        ),
        role_histories:organization_role_histories (
          id,
          role,
          start_date,
          end_date,
          is_leader
        )
      )
    `)
    .eq("seasons.slug", BONGNUDO2_SEASON_SLUG);
}

function createStreamerAffiliationsQuery() {
  return getSupabaseBrowserClient()
    .from("streamer_affiliations")
    .select(
      "id, slug, name, type, parent_affiliation_id, is_filter_visible, is_quick_filter, quick_filter_label, filter_order",
    )
    .order("filter_order", { ascending: true, nullsFirst: false });
}

type CharactersQueryData = QueryData<
  ReturnType<typeof createCharactersQuery>
>;
type CharacterParticipant = CharactersQueryData[number];

export async function getCharacters(): Promise<CharacterDirectoryData> {
  const [charactersResult, affiliationsResult] = await Promise.all([
    createCharactersQuery(),
    createStreamerAffiliationsQuery(),
  ]);

  if (charactersResult.error) {
    throw new Error("인물 정보를 불러오지 못함.", {
      cause: charactersResult.error,
    });
  }

  if (affiliationsResult.error) {
    throw new Error("소속 정보를 불러오지 못함.", {
      cause: affiliationsResult.error,
    });
  }

  return {
    characters: charactersResult.data.map(toCharacterListItem),
    streamerAffiliations: affiliationsResult.data.flatMap(
      toStreamerAffiliationMaster,
    ),
  };
}

export function toCharacterListItem(
  participant: CharacterParticipant,
): CharacterListItem {
  return {
    birthDate: participant.birth_date,
    id: participant.id,
    streamerId: participant.streamer.id,
    chzzkChannelId: participant.streamer.chzzk_channel_id,
    slug: participant.streamer.slug,
    streamerName: participant.streamer.name,
    rpName: participant.rp_name,
    profileImageUrl: getR2PublicUrl(participant.streamer.profile_image_key),
    rpFullBodyImageUrl: getR2PublicUrl(participant.full_body_image_key),
    rpProfileImageUrl: getR2PublicUrl(participant.portrait_image_key),
    channelUrl: participant.streamer.chzzk_channel_id
      ? `https://chzzk.naver.com/${participant.streamer.chzzk_channel_id}`
      : null,
    streamerAffiliations: getOrderedStreamerAffiliations(
      participant.streamer.affiliation_memberships.flatMap(
        toStreamerAffiliation,
      ),
    ),
    affiliations: getOrderedAffiliations(
      participant.memberships.flatMap(toCurrentCharacterAffiliation),
    ),
    roleHistories: participant.memberships.flatMap(toCharacterRoleHistories),
    statedAge: participant.stated_age,
  };
}

function toCharacterRoleHistories(
  membership: CharacterParticipant["memberships"][number],
): CharacterRoleHistory[] {
  const category = getOrganizationCategory(membership.organization.type);

  if (category === null) {
    return [];
  }

  return membership.role_histories.map((roleHistory) => ({
    id: roleHistory.id,
    organizationSlug: membership.organization.slug,
    organizationName: membership.organization.name,
    category,
    role: roleHistory.role,
    startDate: roleHistory.start_date,
    endDate: roleHistory.end_date,
    isLeader: roleHistory.is_leader,
  }));
}

function toStreamerAffiliation(
  membership: CharacterParticipant["streamer"]["affiliation_memberships"][number],
): CharacterStreamerAffiliation[] {
  const type = getStreamerAffiliationType(membership.affiliation.type);

  if (type === null) {
    return [];
  }

  return [
    {
      id: membership.affiliation.id,
      slug: membership.affiliation.slug,
      name: membership.affiliation.name,
      type,
      sortOrder: membership.sort_order,
    },
  ];
}

function toCurrentCharacterAffiliation(
  membership: CharacterParticipant["memberships"][number],
): CharacterAffiliation[] {
  const currentRole = membership.role_histories.find(
    (roleHistory) => roleHistory.end_date === null,
  );
  const category = getOrganizationCategory(membership.organization.type);

  if (!currentRole || category === null) {
    return [];
  }

  return [
    {
      id: membership.id,
      slug: membership.organization.slug,
      name: membership.organization.name,
      category,
      role: currentRole.role,
      isPrimary: membership.is_primary,
      displayOrder: membership.display_order,
      isLeader: currentRole.is_leader,
    },
  ];
}

function getStreamerAffiliationType(
  type: string,
): CharacterStreamerAffiliationType | null {
  if (type === "mcn" || type === "group") {
    return type;
  }

  return null;
}

type StreamerAffiliationsQueryData = QueryData<
  ReturnType<typeof createStreamerAffiliationsQuery>
>;

function toStreamerAffiliationMaster(
  affiliation: StreamerAffiliationsQueryData[number],
): StreamerAffiliation[] {
  const type = getStreamerAffiliationType(affiliation.type);

  if (type === null) {
    return [];
  }

  return [
    {
      id: affiliation.id,
      slug: affiliation.slug,
      name: affiliation.name,
      type,
      parentAffiliationId: affiliation.parent_affiliation_id,
      isFilterVisible: affiliation.is_filter_visible,
      isQuickFilter: affiliation.is_quick_filter,
      quickFilterLabel: affiliation.quick_filter_label,
      filterOrder: affiliation.filter_order,
    },
  ];
}

function getOrganizationCategory(
  organizationType: string,
): CharacterAffiliationCategory | null {
  switch (organizationType) {
    case "institution":
    case "public-service":
      return "public-service";
    case "business":
      return "business";
    case "illegal-business":
      return "illegal-business";
    case "gang":
      return "gang";
    case "crew":
      return "crew";
    default:
      return null;
  }
}
