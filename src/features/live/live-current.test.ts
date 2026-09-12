import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  currentSelect: vi.fn(),
  from: vi.fn(),
  getLiveDatabaseClient: vi.fn(),
}));

vi.mock("./live-database", () => ({
  getLiveDatabaseClient: mocks.getLiveDatabaseClient,
}));

import { getCachedLiveBroadcasts } from "./live-current";

describe("getCachedLiveBroadcasts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getLiveDatabaseClient.mockReturnValue({ from: mocks.from });
    mocks.from.mockReturnValue({ select: mocks.currentSelect });
    mocks.currentSelect.mockResolvedValue({
      data: [{
        live_id: 1,
        live_title: "방송 제목",
        viewer_count: 123,
        thumbnail_url: "https://example.com/thumbnail.jpg",
        refreshed_at: "2026-09-12T10:00:00.000Z",
        participant: {
          streamer: {
            chzzk_channel_id: "channel-1",
            name: "스트리머",
          },
        },
      }],
      error: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

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
    expect(mocks.from).toHaveBeenCalledTimes(1);
    expect(mocks.from).toHaveBeenCalledWith("live_current");
  });

  it("현재 LIVE가 없으면 빈 목록과 null 갱신 시각을 반환함", async () => {
    mocks.currentSelect.mockResolvedValue({ data: [], error: null });

    await expect(getCachedLiveBroadcasts()).resolves.toEqual({
      broadcasts: [],
      refreshedAt: null,
    });
  });

  it("Gateway Timeout 뒤 한 번 재시도해 성공함", async () => {
    vi.useFakeTimers();
    mocks.currentSelect
      .mockResolvedValueOnce({
        data: null,
        error: { code: "504", message: "Gateway Timeout" },
      })
      .mockResolvedValueOnce({
        data: [],
        error: null,
      });

    const result = getCachedLiveBroadcasts();
    await vi.advanceTimersByTimeAsync(250);

    await expect(result).resolves.toEqual({
      broadcasts: [],
      refreshedAt: null,
    });
    expect(mocks.currentSelect).toHaveBeenCalledTimes(2);
  });

  it("네트워크 오류 뒤 한 번 재시도해 성공함", async () => {
    vi.useFakeTimers();
    mocks.currentSelect
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce({
        data: [],
        error: null,
      });

    const result = getCachedLiveBroadcasts();
    await vi.advanceTimersByTimeAsync(250);

    await expect(result).resolves.toEqual({
      broadcasts: [],
      refreshedAt: null,
    });
    expect(mocks.currentSelect).toHaveBeenCalledTimes(2);
  });

  it("Gateway Timeout이 계속되면 한 번만 재시도한 뒤 실패함", async () => {
    vi.useFakeTimers();
    const gatewayTimeout = { code: "504", message: "Gateway Timeout" };
    mocks.currentSelect.mockResolvedValue({
      data: null,
      error: gatewayTimeout,
    });

    const result = getCachedLiveBroadcasts();
    const rejection = expect(result).rejects.toThrow(
      "저장된 실시간 방송 정보를 불러오지 못함.",
    );
    await vi.advanceTimersByTimeAsync(250);

    await rejection;
    expect(mocks.currentSelect).toHaveBeenCalledTimes(2);
  });

  it("권한 오류는 재시도하지 않음", async () => {
    mocks.currentSelect.mockResolvedValue({
      data: null,
      error: { code: "42501", message: "permission denied" },
    });

    await expect(getCachedLiveBroadcasts()).rejects.toThrow(
      "저장된 실시간 방송 정보를 불러오지 못함.",
    );
    expect(mocks.currentSelect).toHaveBeenCalledTimes(1);
  });
});
