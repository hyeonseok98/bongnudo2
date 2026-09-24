import "server-only";

import type { QueryData } from "@supabase/supabase-js";

import { getSupabaseServerClient } from "@/lib/supabase/server";

const BONGNUDO2_SEASON_SLUG = "bongnudo-2";

function createCharacterMetadataQuery() {
  return getSupabaseServerClient()
    .from("season_participants")
    .select(`
      id,
      rp_name,
      seasons!season_participants_season_id_fkey!inner (slug),
      streamer:streamers!inner (name, slug)
    `)
    .eq("seasons.slug", BONGNUDO2_SEASON_SLUG);
}

type CharacterMetadataRecord = QueryData<
  ReturnType<typeof createCharacterMetadataQuery>
>[number];

export async function getStreamerMetadata(
  slug: string,
): Promise<CharacterMetadataRecord | null> {
  const result = await createCharacterMetadataQuery()
    .eq("streamer.slug", slug)
    .limit(1)
    .maybeSingle();

  if (result.error) {
    throw new Error("스트리머 정보를 불러오지 못함.", { cause: result.error });
  }

  return result.data;
}

export async function getRpMetadata(
  id: string,
): Promise<CharacterMetadataRecord | null> {
  const result = await createCharacterMetadataQuery()
    .eq("id", id)
    .maybeSingle();

  if (result.error) {
    throw new Error("RP 캐릭터 정보를 불러오지 못함.", { cause: result.error });
  }

  return result.data as CharacterMetadataRecord | null;
}
