import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  currentSelect: vi.fn(),
  from: vi.fn(),
  getLiveDatabaseClient: vi.fn(),
  stateEq: vi.fn(),
  stateSelect: vi.fn(),
  stateSingle: vi.fn(),
}));

vi.mock("./live-database", () => ({
  getLiveDatabaseClient: mocks.getLiveDatabaseClient,
}));

import { getCachedLiveBroadcasts } from "./live-current";

describe("getCachedLiveBroadcasts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getLiveDatabaseClient.mockReturnValue({ from: mocks.from });
    mocks.from.mockImplementation((table: string) => {
      if (table === "live_current") {
        return { select: mocks.currentSelect };
      }

      return { select: mocks.stateSelect };
    });
    mocks.stateSelect.mockReturnValue({ eq: mocks.stateEq });
    mocks.stateEq.mockReturnValue({ single: mocks.stateSingle });
    mocks.currentSelect.mockResolvedValue({
      data: [{
        live_id: 1,
        live_title: "방송 제목",
        viewer_count: 123,
        thumbnail_url: "https://example.com/thumbnail.jpg",
        participant: {
          streamer: {
            chzzk_channel_id: "channel-1",
            name: "스트리머",
          },
        },
      }],
      error: null,
    });
    mocks.stateSingle.mockResolvedValue({
      data: { refreshed_at: "2026-09-12T10:00:00.000Z" },
      error: null,
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("current와 기존 참가자 정보를 조합해 기존 방송 shape를 반환함", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(getCachedLiveBroadcasts()).resolves.toEqual({
      broadcasts: [{
        liveId: 1,
        title: "방송 제목",
        thumbnailUrl: "https://example.com/thumbnail.jpg",
        concurrentUserCount: 123,
        channelId: "channel-1",
        channelName: "스트리머",
      }],
      refreshedAt: "2026-09-12T10:00:00.000Z",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("현재 LIVE가 없어도 마지막 갱신 시각을 반환함", async () => {
    mocks.currentSelect.mockResolvedValue({ data: [], error: null });

    await expect(getCachedLiveBroadcasts()).resolves.toEqual({
      broadcasts: [],
      refreshedAt: "2026-09-12T10:00:00.000Z",
    });
  });
});
