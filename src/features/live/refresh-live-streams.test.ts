import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getCurrentLiveStreams: vi.fn(),
  getLiveDatabaseClient: vi.fn(),
  rpc: vi.fn(),
  select: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("./get-current-live-streams", () => ({
  getCurrentLiveStreams: mocks.getCurrentLiveStreams,
}));
vi.mock("./live-database", () => ({
  getLiveDatabaseClient: mocks.getLiveDatabaseClient,
}));

import {
  getMinuteSampledAt,
  refreshLiveStreams,
  shouldCollectViewerSnapshot,
} from "./refresh-live-streams";

describe("refreshLiveStreams", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.getLiveDatabaseClient.mockReturnValue({
      from: mocks.from,
      rpc: mocks.rpc,
    });
    mocks.rpc.mockImplementation((name: string) => {
      if (name === "try_acquire_live_refresh") {
        return Promise.resolve({ data: true, error: null });
      }

      if (name === "replace_live_current") {
        return Promise.resolve({ data: 1, error: null });
      }

      return Promise.resolve({ data: undefined, error: null });
    });
    mocks.from.mockReturnValue({ upsert: mocks.upsert });
    mocks.upsert.mockReturnValue({ select: mocks.select });
    mocks.select.mockResolvedValue({ data: [{ id: "snapshot-id" }], error: null });
    mocks.getCurrentLiveStreams.mockImplementation(
      async ({ onMetrics }: {
        onMetrics?: (metrics: ReturnType<typeof createMetrics>) => void;
      }) => {
        onMetrics?.(createMetrics());
        return [createLiveStream()];
      },
    );
  });

  afterEach(() => vi.restoreAllMocks());

  it("동일한 deduplicated LIVE 결과로 current와 snapshot을 저장함", async () => {
    const result = await refreshLiveStreams(
      new Date("2026-09-12T08:00:42.000Z"),
    );

    expect(result).toMatchObject({
      currentStored: 1,
      skippedDueToLock: false,
      snapshotSkipped: false,
      snapshotStoredCount: 1,
    });
    expect(mocks.getCurrentLiveStreams).toHaveBeenCalledWith({
      onMetrics: expect.any(Function),
      runId: result.runId,
    });
    expect(mocks.rpc).toHaveBeenCalledWith("replace_live_current", {
      p_live_streams: [{
        season_participant_id: "participant-1",
        live_id: 1,
        live_title: "방송 제목",
        viewer_count: 123,
        thumbnail_url: "https://example.com/thumbnail.jpg",
        live_started_at: "2026-09-12T07:30:00.000Z",
      }],
      p_refreshed_at: expect.any(String),
      p_run_id: result.runId,
    });
    expect(mocks.upsert).toHaveBeenCalledWith(
      [{
        season_participant_id: "participant-1",
        viewer_count: 123,
        sampled_at: "2026-09-12T08:00:00.000Z",
      }],
      {
        ignoreDuplicates: true,
        onConflict: "season_participant_id,sampled_at",
      },
    );
    expect(mocks.rpc).toHaveBeenLastCalledWith("release_live_refresh", {
      p_run_id: result.runId,
    });
  });

  it("운영 시간 밖에는 current만 교체함", async () => {
    const result = await refreshLiveStreams(
      new Date("2026-09-11T19:01:00.000Z"),
    );

    expect(result.snapshotSkipped).toBe(true);
    expect(result.snapshotStoredCount).toBe(0);
    expect(mocks.rpc).toHaveBeenCalledWith(
      "replace_live_current",
      expect.any(Object),
    );
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("LIVE가 0명이면 빈 배열로 current를 교체함", async () => {
    mocks.getCurrentLiveStreams.mockResolvedValue([]);
    mocks.rpc.mockImplementation((name: string) => {
      if (name === "try_acquire_live_refresh") {
        return Promise.resolve({ data: true, error: null });
      }

      if (name === "replace_live_current") {
        return Promise.resolve({ data: 0, error: null });
      }

      return Promise.resolve({ data: undefined, error: null });
    });

    const result = await refreshLiveStreams(
      new Date("2026-09-12T08:00:00.000Z"),
    );

    expect(result.currentStored).toBe(0);
    expect(mocks.rpc).toHaveBeenCalledWith("replace_live_current", {
      p_live_streams: [],
      p_refreshed_at: expect.any(String),
      p_run_id: result.runId,
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("이미 refresh 중이면 CHZZK pagination을 시작하지 않음", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: false, error: null });

    const result = await refreshLiveStreams();

    expect(result.skippedDueToLock).toBe(true);
    expect(mocks.getCurrentLiveStreams).not.toHaveBeenCalled();
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });

  it("CHZZK pagination 실패 시 current를 교체하지 않고 lease를 해제함", async () => {
    mocks.getCurrentLiveStreams.mockRejectedValue(
      new Error("치지직 LIVE API 요청에 실패함."),
    );

    await expect(refreshLiveStreams()).rejects.toThrow(
      "치지직 LIVE API 요청에 실패함.",
    );
    expect(mocks.rpc).not.toHaveBeenCalledWith(
      "replace_live_current",
      expect.anything(),
    );
    expect(mocks.rpc).toHaveBeenLastCalledWith(
      "release_live_refresh",
      expect.objectContaining({ p_run_id: expect.any(String) }),
    );
    expect(mocks.from).not.toHaveBeenCalled();
  });
});

describe("shouldCollectViewerSnapshot", () => {
  it.each([
    ["16:59", "2026-09-12T07:59:00.000Z", false],
    ["17:00", "2026-09-12T08:00:00.000Z", true],
    ["23:59", "2026-09-12T14:59:00.000Z", true],
    ["00:00", "2026-09-12T15:00:00.000Z", true],
    ["03:59", "2026-09-12T18:59:00.000Z", true],
    ["04:00", "2026-09-12T19:00:59.000Z", true],
    ["04:01", "2026-09-12T19:01:00.000Z", false],
  ])("KST %s를 판정함", (_label, isoDate, expected) => {
    expect(shouldCollectViewerSnapshot(new Date(isoDate))).toBe(expected);
  });
});

describe("getMinuteSampledAt", () => {
  it("한 refresh의 시각을 UTC 분 경계로 정규화함", () => {
    expect(getMinuteSampledAt(new Date("2026-09-11T09:31:48.912Z"))).toBe(
      "2026-09-11T09:31:00.000Z",
    );
  });
});

function createLiveStream() {
  return {
    seasonParticipantId: "participant-1",
    liveStartedAt: "2026-09-12T07:30:00.000Z",
    broadcast: {
      liveId: 1,
      title: "방송 제목",
      thumbnailUrl: "https://example.com/thumbnail.jpg",
      concurrentUserCount: 123,
      channelId: "channel-1",
      channelName: "스트리머",
    },
  };
}

function createMetrics() {
  return {
    chzzkPaginationMs: 1_000,
    matchedParticipantCount: 1,
    pageCount: 2,
    pageDurationsMs: [400, 600],
    participantLookupMs: 20,
    participantMatchMs: 1,
    totalLiveCount: 40,
  };
}
