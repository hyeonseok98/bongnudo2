import type { QueryData } from "@supabase/supabase-js";

import type {
  Organization,
  OrganizationMember,
} from "@/features/organizations/organization";
import { getR2PublicUrl } from "@/lib/r2";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const BONGNUDO2_SEASON_SLUG = "bongnudo-2";

function createOrganizationsQuery() {
  return getSupabaseBrowserClient()
    .from("organizations")
    .select(`
      id,
      slug,
      name,
      type,
      logo_image_key,
      seasons!organizations_season_id_fkey!inner (),
      memberships:organization_memberships (
        id,
        display_order,
        left_at,
        role,
        participant:season_participants!inner (
          id,
          rp_name
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

export async function getOrganizations(): Promise<Organization[]> {
  const result = await createOrganizationsQuery();

  if (result.error) {
    throw new Error("조직 정보를 불러오지 못함.", {
      cause: result.error,
    });
  }

  return result.data.map(toOrganization);
}

function toOrganization(organization: OrganizationRow): Organization {
  return {
    id: organization.id,
    logoImageUrl: getR2PublicUrl(organization.logo_image_key),
    members: organization.memberships.flatMap(toCurrentMember),
    name: organization.name,
    slug: organization.slug,
    type: organization.type,
  };
}

function toCurrentMember(
  membership: OrganizationRow["memberships"][number],
): OrganizationMember[] {
  if (membership.left_at !== null || !membership.participant.rp_name) {
    return [];
  }

  const currentRole = membership.role_histories.find(
    (history) => history.end_date === null,
  );

  return [{
    id: membership.participant.id,
    displayOrder: membership.display_order,
    isLeader: currentRole?.is_leader ?? false,
    profileImageUrl: null,
    role: currentRole?.role ?? membership.role,
    roleStartedAt: currentRole?.start_date ?? null,
    rpName: membership.participant.rp_name,
  }];
}
