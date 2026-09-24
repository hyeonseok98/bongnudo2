import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";

const BONGNUDO2_SEASON_SLUG = "bongnudo-2";

export async function getOrganizationMetadata(slug: string) {
  const result = await getSupabaseServerClient()
    .from("organizations")
    .select("name, slug, seasons!organizations_season_id_fkey!inner(slug)")
    .eq("seasons.slug", BONGNUDO2_SEASON_SLUG)
    .eq("slug", slug)
    .maybeSingle();

  if (result.error) {
    throw new Error("조직 정보를 불러오지 못함.", { cause: result.error });
  }

  return result.data;
}
