import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import { BONGNUDO2_SEASON_SLUG } from "./season-config";

export async function getBongnudo2SeasonId(
  client: SupabaseClient<Database>,
): Promise<number> {
  const seasonId = await getBongnudo2SeasonIdOrNull(client);

  if (seasonId === null) {
    throw new Error("봉누도2 시즌을 확인하지 못함.");
  }

  return seasonId;
}

export async function getBongnudo2SeasonIdOrNull(
  client: SupabaseClient<Database>,
): Promise<number | null> {
  const result = await client
    .from("seasons")
    .select("id")
    .eq("slug", BONGNUDO2_SEASON_SLUG)
    .maybeSingle();

  if (result.error) {
    return null;
  }

  return result.data?.id ?? null;
}

export async function getActiveSeasonId(
  client: SupabaseClient<Database>,
): Promise<number> {
  const result = await client
    .from("seasons")
    .select("id")
    .eq("is_active", true)
    .limit(2);

  if (result.error || result.data.length !== 1) {
    throw new Error("활성 시즌을 확인하지 못함.", { cause: result.error });
  }

  return result.data[0].id;
}
