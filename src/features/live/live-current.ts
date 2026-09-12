import "server-only";

import type { QueryData } from "@supabase/supabase-js";

import type {
  LiveBroadcast,
  LiveBroadcastsResponse,
} from "./live-stream";
import { getLiveDatabaseClient } from "./live-database";

function createLiveCurrentQuery(
  supabase = getLiveDatabaseClient(),
) {
  return supabase
    .from("live_current")
    .select(`
      live_id,
      live_title,
      viewer_count,
      thumbnail_url,
      participant:season_participants!live_current_season_participant_id_fkey!inner (
        streamer:streamers!season_participants_streamer_id_fkey!inner (
          chzzk_channel_id,
          name
        )
      )
    `);
}

type LiveCurrentQueryData = QueryData<ReturnType<typeof createLiveCurrentQuery>>;

export async function getCachedLiveBroadcasts(): Promise<LiveBroadcastsResponse> {
  const supabase = getLiveDatabaseClient();
  const [currentResult, stateResult] = await Promise.all([
    createLiveCurrentQuery(supabase),
    supabase
      .from("live_refresh_state")
      .select("refreshed_at")
      .eq("singleton", true)
      .single(),
  ]);

  if (currentResult.error || stateResult.error) {
    throw new Error("저장된 실시간 방송 정보를 불러오지 못함.", {
      cause: currentResult.error ?? stateResult.error,
    });
  }

  return {
    broadcasts: currentResult.data.flatMap(toLiveBroadcast),
    refreshedAt: stateResult.data.refreshed_at,
  };
}

function toLiveBroadcast(
  row: LiveCurrentQueryData[number],
): LiveBroadcast[] {
  const channelId = row.participant.streamer.chzzk_channel_id;

  if (!channelId) {
    return [];
  }

  return [{
    liveId: row.live_id,
    title: row.live_title,
    thumbnailUrl: row.thumbnail_url,
    concurrentUserCount: row.viewer_count,
    channelId,
    channelName: row.participant.streamer.name,
  }];
}
