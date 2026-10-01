import "server-only";

import type { QueryData } from "@supabase/supabase-js";

import { getLiveDatabaseClient } from "./live-database";
import { SURGING_LIVE_CONFIG } from "./surging-live-config";
import type { SurgingLiveBroadcast } from "./live-stream";

interface SnapshotPoint {
  sampledAt: Date;
  viewerCount: number;
}

interface CurrentLiveRow {
  channelId: string;
  liveStartedAt: Date | null;
  broadcast: SurgingLiveBroadcast;
  seasonParticipantId: string;
}

interface RankedBroadcast extends CurrentLiveRow {
  baselineViewerCount: number;
  viewerDelta: number;
  viewerRate: number;
}

function createCurrentLiveQuery() {
  return getLiveDatabaseClient().from("live_current").select(`
    season_participant_id,
    live_id,
    live_title,
    viewer_count,
    thumbnail_url,
    live_started_at,
    refreshed_at,
    participant:season_participants!live_current_season_participant_id_fkey!inner (
      streamer:streamers!season_participants_streamer_id_fkey!inner (
        chzzk_channel_id,
        name
      )
    )
  `);
}

type CurrentLiveQueryData = QueryData<ReturnType<typeof createCurrentLiveQuery>>;

export interface SurgingLiveBroadcastsResponse {
  broadcasts: SurgingLiveBroadcast[];
  refreshedAt: string | null;
}

export async function getSurgingLiveBroadcasts(
  now = new Date(),
): Promise<SurgingLiveBroadcastsResponse> {
  const currentResult = await createCurrentLiveQuery();

  if (currentResult.error) {
    throw new Error("현재 LIVE 정보를 불러오지 못함.", {
      cause: currentResult.error,
    });
  }

  const currentRows = currentResult.data.flatMap((row) => {
    const currentLiveRow = toCurrentLiveRow(row);

    return currentLiveRow ? [currentLiveRow] : [];
  });

  if (currentRows.length === 0) {
    return {
      broadcasts: [],
      refreshedAt: null,
    };
  }

  const snapshotResult = await getLiveDatabaseClient()
    .from("live_viewer_snapshots")
    .select("season_participant_id, viewer_count, sampled_at")
    .in(
      "season_participant_id",
      currentRows.map((row) => row.seasonParticipantId),
    )
    .gte("sampled_at", toIso(now, SURGING_LIVE_CONFIG.lookbackMinutes))
    .lte("sampled_at", now.toISOString())
    .order("sampled_at", { ascending: false });

  if (snapshotResult.error) {
    throw new Error("시청자 수 추이를 불러오지 못함.", {
      cause: snapshotResult.error,
    });
  }

  const snapshotsByParticipant = groupSnapshots(snapshotResult.data);
  const ranked = currentRows.flatMap((row) => {
    const points = snapshotsByParticipant.get(row.seasonParticipantId) ?? [];
    const metrics = calculateSurgeMetrics(points, row.liveStartedAt, now);

    if (!metrics) {
      return [];
    }

    return [{ ...row, ...metrics }];
  });
  const scored = applySurgeScores(ranked);

  return {
    broadcasts: scored
      .sort(compareSurgingBroadcasts)
      .slice(0, SURGING_LIVE_CONFIG.limit)
      .map(({ broadcast, viewerDelta, viewerRate }) => ({
        ...broadcast,
        viewerDelta,
        viewerRate,
        surgeScore: broadcast.surgeScore,
      })),
    refreshedAt: currentRows[0]?.broadcast
      ? currentResult.data[0]?.refreshed_at ?? null
      : null,
  };
}

function toCurrentLiveRow(
  row: CurrentLiveQueryData[number],
): CurrentLiveRow | null {
  const channelId = row.participant.streamer.chzzk_channel_id;

  if (!channelId) {
    return null;
  }

  return {
    broadcast: {
      channelId,
      channelName: row.participant.streamer.name,
      concurrentUserCount: row.viewer_count,
      liveId: row.live_id,
      thumbnailUrl: row.thumbnail_url,
      title: row.live_title,
      baselineViewerCount: 0,
      viewerDelta: 0,
      viewerRate: 0,
      surgeScore: 0,
    },
    channelId,
    liveStartedAt: row.live_started_at ? new Date(row.live_started_at) : null,
    seasonParticipantId: row.season_participant_id,
  };
}

function groupSnapshots(
  rows: Array<{
    season_participant_id: string;
    sampled_at: string;
    viewer_count: number;
  }>,
): Map<string, SnapshotPoint[]> {
  const grouped = new Map<string, SnapshotPoint[]>();

  for (const row of rows) {
    const points = grouped.get(row.season_participant_id) ?? [];
    points.push({
      sampledAt: new Date(row.sampled_at),
      viewerCount: row.viewer_count,
    });
    grouped.set(row.season_participant_id, points);
  }

  return grouped;
}

function calculateSurgeMetrics(
  points: SnapshotPoint[],
  liveStartedAt: Date | null,
  now: Date,
): Pick<RankedBroadcast, "baselineViewerCount" | "viewerDelta" | "viewerRate"> | null {
  const recentStart = subtractMinutes(now, SURGING_LIVE_CONFIG.recentWindowMinutes);
  const baselineStart = subtractMinutes(
    now,
    SURGING_LIVE_CONFIG.baselineWindowEndMinutes,
  );
  const baselineEnd = subtractMinutes(
    now,
    SURGING_LIVE_CONFIG.baselineWindowStartMinutes,
  );
  const eligiblePoints = points.filter(
    (point) => !liveStartedAt || point.sampledAt >= liveStartedAt,
  );
  const recentPoints = eligiblePoints.filter(
    (point) => point.sampledAt >= recentStart && point.sampledAt <= now,
  );
  const baselinePoints = eligiblePoints.filter(
    (point) => point.sampledAt >= baselineStart && point.sampledAt <= baselineEnd,
  );

  if (
    recentPoints.length < SURGING_LIVE_CONFIG.minimumSamples
    || baselinePoints.length < SURGING_LIVE_CONFIG.minimumSamples
  ) {
    return null;
  }

  const latestRecent = Math.max(
    ...recentPoints.map((point) => point.sampledAt.getTime()),
  );
  if (
    now.getTime() - latestRecent
    > SURGING_LIVE_CONFIG.freshnessMinutes * 60 * 1000
  ) {
    return null;
  }

  const recentViewerCount = Math.round(
    median(recentPoints.map((point) => point.viewerCount)),
  );
  const baselineViewerCount = Math.round(
    median(baselinePoints.map((point) => point.viewerCount)),
  );

  if (baselineViewerCount <= 0) {
    return null;
  }

  const viewerDelta = recentViewerCount - baselineViewerCount;
  if (viewerDelta <= 0) {
    return null;
  }

  return {
    baselineViewerCount,
    viewerDelta,
    viewerRate: viewerDelta / baselineViewerCount,
  };
}

function applySurgeScores(rows: RankedBroadcast[]): RankedBroadcast[] {
  const deltas = rows.map((row) => row.viewerDelta);
  const rates = rows.map((row) => row.viewerRate);
  const minDelta = Math.min(...deltas);
  const maxDelta = Math.max(...deltas);
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);

  return rows.map((row) => ({
    ...row,
    broadcast: {
      ...row.broadcast,
      baselineViewerCount: row.baselineViewerCount,
      viewerDelta: row.viewerDelta,
      viewerRate: row.viewerRate,
      surgeScore:
        normalize(row.viewerDelta, minDelta, maxDelta) * 0.6
        + normalize(row.viewerRate, minRate, maxRate) * 0.4,
    },
  }));
}

function compareSurgingBroadcasts(left: RankedBroadcast, right: RankedBroadcast) {
  return (
    right.broadcast.surgeScore - left.broadcast.surgeScore
    || right.viewerDelta - left.viewerDelta
    || right.viewerRate - left.viewerRate
    || left.broadcast.liveId - right.broadcast.liveId
  );
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function normalize(value: number, minimum: number, maximum: number): number {
  return minimum === maximum ? 1 : (value - minimum) / (maximum - minimum);
}

function subtractMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() - minutes * 60 * 1000);
}

function toIso(date: Date, minutesAgo: number): string {
  return subtractMinutes(date, minutesAgo).toISOString();
}
