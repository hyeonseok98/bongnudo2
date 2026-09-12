import "server-only";

import type { QueryData } from "@supabase/supabase-js";

import type {
  LiveBroadcast,
  LiveBroadcastsResponse,
} from "./live-stream";
import { getLiveDatabaseClient } from "./live-database";

const LIVE_CURRENT_RETRY_DELAY_MS = 250;
const TRANSIENT_ERROR_CODES = new Set([
  "502",
  "503",
  "504",
  "ECONNRESET",
  "ETIMEDOUT",
  "PGRST003",
  "UND_ERR_CONNECT_TIMEOUT",
]);
const TRANSIENT_ERROR_MESSAGES = [
  "gateway timeout",
  "failed to fetch",
  "fetch failed",
  "network error",
  "networkerror",
  "connection reset",
  "connection timed out",
];

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
      refreshed_at,
      participant:season_participants!live_current_season_participant_id_fkey!inner (
        streamer:streamers!season_participants_streamer_id_fkey!inner (
          chzzk_channel_id,
          name
        )
      )
    `);
}

type LiveCurrentQueryData = QueryData<ReturnType<typeof createLiveCurrentQuery>>;
type LiveCurrentQueryResult = Awaited<ReturnType<typeof createLiveCurrentQuery>>;

export async function getCachedLiveBroadcasts(): Promise<LiveBroadcastsResponse> {
  const supabase = getLiveDatabaseClient();
  const currentResult = await getLiveCurrentWithRetry(supabase);

  if (currentResult.error) {
    throw new Error("저장된 실시간 방송 정보를 불러오지 못함.", {
      cause: currentResult.error,
    });
  }

  return {
    broadcasts: currentResult.data.flatMap(toLiveBroadcast),
    refreshedAt: currentResult.data[0]?.refreshed_at ?? null,
  };
}

async function getLiveCurrentWithRetry(
  supabase: ReturnType<typeof getLiveDatabaseClient>,
): Promise<LiveCurrentQueryResult> {
  try {
    const result = await createLiveCurrentQuery(supabase);

    if (!result.error || !isTransientLiveCurrentError(result.error)) {
      return result;
    }
  } catch (error) {
    if (!isTransientLiveCurrentError(error)) {
      throw error;
    }
  }

  await new Promise<void>((resolve) => {
    setTimeout(resolve, LIVE_CURRENT_RETRY_DELAY_MS);
  });

  return createLiveCurrentQuery(supabase);
}

function isTransientLiveCurrentError(error: unknown): boolean {
  const code = getErrorCode(error).toUpperCase();
  const message = getErrorMessage(error).toLowerCase();

  return TRANSIENT_ERROR_CODES.has(code)
    || TRANSIENT_ERROR_MESSAGES.some((fragment) => message.includes(fragment));
}

function getErrorCode(error: unknown): string {
  if (
    typeof error === "object"
    && error !== null
    && "code" in error
    && typeof error.code === "string"
  ) {
    return error.code;
  }

  return "";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object"
    && error !== null
    && "message" in error
    && typeof error.message === "string"
  ) {
    return error.message;
  }

  return "";
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
