import "server-only";

import type { QueryData } from "@supabase/supabase-js";

import { getR2PublicUrl } from "@/lib/r2";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const BONGNUDO2_SEASON_SLUG = "bongnudo-2";

export interface OrganizationSummary {
  id: string;
  memberCount: number;
  name: string;
  slug: string;
  type: string;
}

export interface OrganizationMember {
  displayOrder: number | null;
  isLeader: boolean;
  profileImageUrl: string | null;
  role: string | null;
  rpName: string;
  seasonParticipantId: string;
  streamerName: string | null;
}

export interface OrganizationDetail extends OrganizationSummary {
  members: OrganizationMember[];
}

function createOrganizationsQuery() {
  return getSupabaseServerClient()
    .from("organizations")
    .select(`
      id,
      slug,
      name,
      type,
      seasons!organizations_season_id_fkey!inner (),
      memberships:organization_memberships (
        id,
        display_order,
        left_at,
        role,
        participant:season_participants!inner (
          id,
          rp_name,
          portrait_image_key,
          streamer:streamers!inner (
            name
          )
        ),
        role_histories:organization_role_histories (
          role,
          start_date,
          end_date,
          is_leader
        )
      )
    `)
    .eq("seasons.slug", BONGNUDO2_SEASON_SLUG)
    .order("name", { ascending: true });
}

type OrganizationsQueryData = QueryData<
  ReturnType<typeof createOrganizationsQuery>
>;
type OrganizationRow = OrganizationsQueryData[number];
type OrganizationMembership = OrganizationRow["memberships"][number];

export async function getPublicOrganizations(
  query?: string,
): Promise<OrganizationSummary[]> {
  let organizationsQuery = createOrganizationsQuery();
  const normalizedQuery = query?.trim();

  if (normalizedQuery) {
    organizationsQuery = organizationsQuery.ilike(
      "name",
      `%${normalizedQuery}%`,
    );
  }

  const result = await organizationsQuery;

  if (result.error) {
    throw new Error("조직 정보를 불러오지 못함.", {
      cause: result.error,
    });
  }

  return result.data.map(toOrganizationSummary);
}

export async function getPublicOrganization(
  slug: string,
): Promise<OrganizationDetail | null> {
  const result = await createOrganizationsQuery().eq("slug", slug).maybeSingle();

  if (result.error) {
    throw new Error("조직 정보를 불러오지 못함.", {
      cause: result.error,
    });
  }

  return result.data ? toOrganizationDetail(result.data) : null;
}

function toOrganizationSummary(
  organization: OrganizationRow,
): OrganizationSummary {
  return {
    id: organization.id,
    memberCount: getCurrentMembers(organization.memberships).length,
    name: organization.name,
    slug: organization.slug,
    type: organization.type,
  };
}

function toOrganizationDetail(
  organization: OrganizationRow,
): OrganizationDetail {
  const members = getCurrentMembers(organization.memberships);

  return {
    ...toOrganizationSummary(organization),
    members: sortMembers(members),
  };
}

function getCurrentMembers(
  memberships: OrganizationMembership[],
): OrganizationMemberWithRoleStart[] {
  return memberships.flatMap((membership) => {
    if (membership.left_at !== null || !membership.participant.rp_name) {
      return [];
    }

    const currentRole = membership.role_histories.find(
      (history) => history.end_date === null,
    );

    return [{
      displayOrder: membership.display_order,
      isLeader: currentRole?.is_leader ?? false,
      profileImageUrl: getR2PublicUrl(
        membership.participant.portrait_image_key,
      ),
      role: currentRole?.role ?? membership.role,
      roleStartedAt: currentRole?.start_date ?? null,
      rpName: membership.participant.rp_name,
      seasonParticipantId: membership.participant.id,
      streamerName: membership.participant.streamer?.name ?? null,
    }];
  });
}

interface OrganizationMemberWithRoleStart extends OrganizationMember {
  roleStartedAt: string | null;
}

function sortMembers(
  members: OrganizationMemberWithRoleStart[],
): OrganizationMember[] {
  const groups = new Map<string, OrganizationMemberWithRoleStart[]>();

  for (const member of members) {
    const group = groups.get(member.role ?? "직책 없음") ?? [];
    group.push(member);
    groups.set(member.role ?? "직책 없음", group);
  }

  return [...groups.values()]
    .map((group) => [...group].sort(compareMembers))
    .sort(compareRoleGroups)
    .flat()
    .map(toPublicMember);
}

function toPublicMember(
  member: OrganizationMemberWithRoleStart,
): OrganizationMember {
  return {
    displayOrder: member.displayOrder,
    isLeader: member.isLeader,
    profileImageUrl: member.profileImageUrl,
    role: member.role,
    rpName: member.rpName,
    seasonParticipantId: member.seasonParticipantId,
    streamerName: member.streamerName,
  };
}

function compareMembers(
  left: OrganizationMemberWithRoleStart,
  right: OrganizationMemberWithRoleStart,
): number {
  if (left.isLeader !== right.isLeader) {
    return left.isLeader ? -1 : 1;
  }

  if (left.displayOrder !== right.displayOrder) {
    return (left.displayOrder ?? Number.MAX_SAFE_INTEGER)
      - (right.displayOrder ?? Number.MAX_SAFE_INTEGER);
  }

  return left.rpName.localeCompare(right.rpName, "ko-KR");
}

function compareRoleGroups(
  left: OrganizationMemberWithRoleStart[],
  right: OrganizationMemberWithRoleStart[],
): number {
  const leftIsLeader = left.some((member) => member.isLeader);
  const rightIsLeader = right.some((member) => member.isLeader);

  if (leftIsLeader !== rightIsLeader) {
    return leftIsLeader ? -1 : 1;
  }

  const leftStartDate = getFirstRoleStartDate(left);
  const rightStartDate = getFirstRoleStartDate(right);

  if (leftStartDate !== rightStartDate) {
    return leftStartDate.localeCompare(rightStartDate);
  }

  return (left[0]?.role ?? "직책 없음").localeCompare(
    right[0]?.role ?? "직책 없음",
    "ko-KR",
  );
}

function getFirstRoleStartDate(
  group: OrganizationMemberWithRoleStart[],
): string {
  return group
    .map((member) => member.roleStartedAt)
    .filter((date): date is string => date !== null)
    .sort()[0] ?? "9999-12-31";
}
