import "server-only";

import { randomUUID } from "node:crypto";

import type { Json } from "@/lib/supabase/database.types";

import {
  getCurrentLiveStreams,
  type CurrentLiveStream,
  type CurrentLiveStreamsMetrics,
} from "./get-current-live-streams";
import { getLiveDatabaseClient } from "./live-database";

const LIVE_REFRESH_LEASE_SECONDS = 180;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export interface LiveRefreshResult {
  currentStored: number;
  refreshedAt: string | null;
  runId: string;
  skippedDueToLock: boolean;
  snapshotSkipped: boolean;
  snapshotStoredCount: number;
}

export async function refreshLiveStreams(
  startedAt = new Date(),
): Promise<LiveRefreshResult> {
  const runId = randomUUID();
  const totalStartedAt = performance.now();
  const supabase = getLiveDatabaseClient();
  let acquired = false;
  let metrics: CurrentLiveStreamsMetrics | undefined;
  let replaceCurrentMs = 0;
  const snapshotSkipped = !shouldCollectViewerSnapshot(startedAt);
  let snapshotStoredCount = 0;

  try {
    const acquireResult = await supabase.rpc("try_acquire_live_refresh", {
      p_lease_seconds: LIVE_REFRESH_LEASE_SECONDS,
      p_run_id: runId,
    });

    if (acquireResult.error) {
      throw new Error("LIVE refresh 잠금을 획득하지 못함.", {
        cause: acquireResult.error,
      });
    }

    acquired = acquireResult.data;

    if (!acquired) {
      const result = {
        currentStored: 0,
        refreshedAt: null,
        runId,
        skippedDueToLock: true,
        snapshotSkipped: true,
        snapshotStoredCount: 0,
      } satisfies LiveRefreshResult;
      logLiveRefresh({
        ...createEmptyMetrics(),
        outcome: "skipped",
        replaceCurrentMs: 0,
        runId,
        skippedDueToLock: true,
        snapshotSkipped: true,
        snapshotStoredCount: 0,
        totalMs: getDurationMs(totalStartedAt),
      });

      return result;
    }

    const liveStreams = await getCurrentLiveStreams({
      onMetrics: (nextMetrics) => {
        metrics = nextMetrics;
      },
    });
    const refreshedAt = new Date().toISOString();
    const replaceStartedAt = performance.now();
    const replaceResult = await supabase.rpc("replace_live_current", {
      p_live_streams: toLiveCurrentRows(liveStreams),
      p_refreshed_at: refreshedAt,
      p_run_id: runId,
    });
    replaceCurrentMs = getDurationMs(replaceStartedAt);

    if (replaceResult.error) {
      throw new Error("현재 LIVE 정보를 교체하지 못함.", {
        cause: replaceResult.error,
      });
    }

    if (!snapshotSkipped) {
      snapshotStoredCount = await saveViewerSnapshots(
        liveStreams,
        getMinuteSampledAt(startedAt),
      );
    }

    const result = {
      currentStored: replaceResult.data,
      refreshedAt,
      runId,
      skippedDueToLock: false,
      snapshotSkipped,
      snapshotStoredCount,
    } satisfies LiveRefreshResult;
    logLiveRefresh({
      ...(metrics ?? createEmptyMetrics()),
      outcome: "success",
      replaceCurrentMs,
      runId,
      skippedDueToLock: false,
      snapshotSkipped,
      snapshotStoredCount,
      totalMs: getDurationMs(totalStartedAt),
    });

    return result;
  } catch (error) {
    logLiveRefresh({
      ...(metrics ?? createEmptyMetrics()),
      outcome: "error",
      replaceCurrentMs,
      runId,
      skippedDueToLock: false,
      snapshotSkipped,
      snapshotStoredCount,
      totalMs: getDurationMs(totalStartedAt),
    });
    throw error;
  } finally {
    if (acquired) {
      try {
        const releaseResult = await supabase.rpc("release_live_refresh", {
          p_run_id: runId,
        });

        if (releaseResult.error) {
          console.error("Failed to release LIVE refresh lease", {
            code: releaseResult.error.code,
            runId,
          });
        }
      } catch (error) {
        console.error("Failed to release LIVE refresh lease", {
          code: getErrorCode(error),
          runId,
        });
      }
    }
  }
}

export function shouldCollectViewerSnapshot(date: Date): boolean {
  const kstDate = new Date(date.getTime() + KST_OFFSET_MS);
  const hour = kstDate.getUTCHours();
  const minute = kstDate.getUTCMinutes();

  return hour >= 17 || hour < 4 || (hour === 4 && minute === 0);
}

export function getMinuteSampledAt(date: Date): string {
  const sampledAt = new Date(date);
  sampledAt.setUTCSeconds(0, 0);

  return sampledAt.toISOString();
}

async function saveViewerSnapshots(
  liveStreams: CurrentLiveStream[],
  sampledAt: string,
): Promise<number> {
  if (liveStreams.length === 0) {
    return 0;
  }

  const snapshots = liveStreams.map(({ seasonParticipantId, broadcast }) => ({
    season_participant_id: seasonParticipantId,
    viewer_count: broadcast.concurrentUserCount,
    sampled_at: sampledAt,
  }));
  const result = await getLiveDatabaseClient()
    .from("live_viewer_snapshots")
    .upsert(snapshots, {
      ignoreDuplicates: true,
      onConflict: "season_participant_id,sampled_at",
    })
    .select("id");

  if (result.error) {
    throw new Error("시청자 수 스냅샷을 저장하지 못함.", {
      cause: result.error,
    });
  }

  return result.data.length;
}

function toLiveCurrentRows(liveStreams: CurrentLiveStream[]): Json {
  return liveStreams.map(({ seasonParticipantId, liveStartedAt, broadcast }) => ({
    season_participant_id: seasonParticipantId,
    live_id: broadcast.liveId,
    live_title: broadcast.title,
    viewer_count: broadcast.concurrentUserCount,
    thumbnail_url: broadcast.thumbnailUrl,
    live_started_at: liveStartedAt,
  }));
}

function createEmptyMetrics(): CurrentLiveStreamsMetrics {
  return {
    chzzkPaginationMs: 0,
    matchedParticipantCount: 0,
    pageCount: 0,
    pageDurationsMs: [],
    participantLookupMs: 0,
    participantMatchMs: 0,
    totalLiveCount: 0,
  };
}

function logLiveRefresh(event: CurrentLiveStreamsMetrics & {
  outcome: "error" | "skipped" | "success";
  replaceCurrentMs: number;
  runId: string;
  skippedDueToLock: boolean;
  snapshotSkipped: boolean;
  snapshotStoredCount: number;
  totalMs: number;
}): void {
  console.info("LIVE refresh", event);
}

function getDurationMs(startedAt: number): number {
  return Math.round(performance.now() - startedAt);
}

function getErrorCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    return typeof error.code === "string" ? error.code : "UNKNOWN";
  }

  return error instanceof Error ? error.name : "UNKNOWN";
}
