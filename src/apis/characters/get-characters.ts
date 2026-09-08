import type {
  CharacterAffiliation,
  CharacterAffiliationCategory,
  CharacterListItem,
} from "@/features/characters/character";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

const BONGNUDO2_SEASON_SLUG = "bongnudo-2";

function createCharactersQuery(seasonId: number) {
  return getSupabaseBrowserClient()
    .from("season_participants")
    .select(`
      id,
      rp_name,
      streamer:streamers!inner (
        slug,
        name,
        group:streamer_groups (
          slug,
          name
        )
      ),
      memberships:organization_memberships (
        id,
        role,
        is_primary,
        left_at,
        organization:organizations!inner (
          slug,
          name,
          type
        )
      )
    `)
    .eq("season_id", seasonId);
}

type CharacterOrganization = Pick<Tables<"organizations">, "slug" | "name" | "type">;

type CharacterMembership = Pick<
  Tables<"organization_memberships">,
  "id" | "role" | "is_primary" | "left_at"
> & {
  organization: CharacterOrganization;
};

interface CharacterParticipant {
  id: Tables<"season_participants">["id"];
  rp_name: Tables<"season_participants">["rp_name"];
  streamer: Pick<Tables<"streamers">, "slug" | "name"> & {
    group: Pick<Tables<"streamer_groups">, "slug" | "name"> | null;
  };
  memberships: CharacterMembership[];
}

export async function getCharacters(): Promise<CharacterListItem[]> {
  const supabase = getSupabaseBrowserClient();
  const { data: season, error: seasonError } = await supabase
    .from("seasons")
    .select("id")
    .eq("slug", BONGNUDO2_SEASON_SLUG)
    .single();

  if (seasonError) {
    throw new Error("시즌 정보를 불러오지 못함.", { cause: seasonError });
  }

  const { data, error } = await createCharactersQuery(season.id);

  if (error) {
    throw new Error("인물 정보를 불러오지 못함.", { cause: error });
  }

  return data.map(toCharacterListItem);
}

function toCharacterListItem(
  participant: CharacterParticipant,
): CharacterListItem {
  return {
    id: participant.id,
    slug: participant.streamer.slug,
    streamerName: participant.streamer.name,
    rpName: participant.rp_name,
    profileImageUrl: null,
    group: participant.streamer.group,
    affiliations: participant.memberships
      .filter((membership) => membership.left_at === null)
      .flatMap(toCharacterAffiliation),
  };
}

function toCharacterAffiliation(
  membership: CharacterMembership,
): CharacterAffiliation[] {
  const category = getOrganizationCategory(membership.organization.type);

  if (category === null) {
    return [];
  }

  return [
    {
      id: membership.id,
      slug: membership.organization.slug,
      name: membership.organization.name,
      category,
      role: membership.role,
      isPrimary: membership.is_primary,
      isLeader: false,
    },
  ];
}

function getOrganizationCategory(
  organizationType: string,
): CharacterAffiliationCategory | null {
  switch (organizationType) {
    case "institution":
    case "public-service":
    case "public_service":
      return "public-service";
    case "business":
      return "business";
    case "illegal-business":
    case "illegal_business":
      return "illegal-business";
    case "gang":
      return "gang";
    case "crew":
      return "crew";
    default:
      return null;
  }
}
