import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentLiveStreams: vi.fn(),
  getSupabaseAdminClient: vi.fn(),
  upsert: vi.fn(),
  select: vi.fn(),
}));

vi.mock("@/features/live/get-current-live-streams", () => ({
  getCurrentLiveStreams: mocks.getCurrentLiveStreams,
}));
vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdminClient: mocks.getSupabaseAdminClient,
}));

import { getMinuteSampledAt, POST } from "./route";

describe("POST /api/internal/live-viewer-snapshots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CRON_SECRET", "test-cron-secret");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-11T09:31:48.912Z"));

    mocks.getSupabaseAdminClient.mockReturnValue({
      from: vi.fn(() => ({ upsert: mocks.upsert })),
    });
    mocks.upsert.mockReturnValue({ select: mocks.select });
    mocks.select.mockResolvedValue({ data: [], error: null });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it.each([
    ["인증 헤더 없음", undefined],
    ["잘못된 secret", "Bearer wrong-secret"],
  ])("%s이면 401을 반환함", async (_label, authorization) => {
    const response = await POST(createRequest(authorization));

    expect(response.status).toBe(401);
    expect(mocks.getCurrentLiveStreams).not.toHaveBeenCalled();
  });

  it("LIVE 참가자들을 동일한 분 경계로 batch 저장함", async () => {
    mocks.getCurrentLiveStreams.mockResolvedValue([
      createLiveStream("participant-1", 123),
      createLiveStream("participant-2", 456),
    ]);
    mocks.select.mockResolvedValue({
      data: [{ id: "snapshot-1" }, { id: "snapshot-2" }],
      error: null,
    });

    const response = await POST(createRequest("Bearer test-cron-secret"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ stored: 2 });
    expect(mocks.upsert).toHaveBeenCalledWith(
      [
        {
          season_participant_id: "participant-1",
          viewer_count: 123,
          sampled_at: "2026-09-11T09:31:00.000Z",
        },
        {
          season_participant_id: "participant-2",
          viewer_count: 456,
          sampled_at: "2026-09-11T09:31:00.000Z",
        },
      ],
      {
        ignoreDuplicates: true,
        onConflict: "season_participant_id,sampled_at",
      },
    );
  });

  it("동일 분 중복 행이 모두 무시되면 stored 0을 반환함", async () => {
    mocks.getCurrentLiveStreams.mockResolvedValue([
      createLiveStream("participant-1", 123),
    ]);

    const response = await POST(createRequest("Bearer test-cron-secret"));

    await expect(response.json()).resolves.toEqual({ stored: 0 });
  });

  it("LIVE가 없으면 DB 요청 없이 stored 0을 반환함", async () => {
    mocks.getCurrentLiveStreams.mockResolvedValue([]);

    const response = await POST(createRequest("Bearer test-cron-secret"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ stored: 0 });
    expect(mocks.getSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it("치지직 전체 페이지 조회가 실패하면 저장하지 않음", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.getCurrentLiveStreams.mockRejectedValue(
      new Error("치지직 LIVE API 요청에 실패함."),
    );

    const response = await POST(createRequest("Bearer test-cron-secret"));

    expect(response.status).toBe(500);
    expect(mocks.getSupabaseAdminClient).not.toHaveBeenCalled();
  });
});

describe("getMinuteSampledAt", () => {
  it("초와 밀리초를 UTC 분 경계로 정규화함", () => {
    expect(getMinuteSampledAt(new Date("2026-09-11T09:31:48.912Z"))).toBe(
      "2026-09-11T09:31:00.000Z",
    );
  });
});

function createRequest(authorization?: string): Request {
  const headers = new Headers();

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  return new Request("http://localhost/api/internal/live-viewer-snapshots", {
    method: "POST",
    headers,
  });
}

function createLiveStream(seasonParticipantId: string, viewerCount: number) {
  return {
    seasonParticipantId,
    broadcast: {
      liveId: 1,
      title: "방송 제목",
      thumbnailUrl: "https://example.com/thumbnail.jpg",
      concurrentUserCount: viewerCount,
      channelId: `channel-${seasonParticipantId}`,
      channelName: "스트리머",
    },
  };
}
