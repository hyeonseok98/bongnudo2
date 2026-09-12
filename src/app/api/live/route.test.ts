import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCachedLiveBroadcasts: vi.fn(),
}));

vi.mock("@/features/live/live-current", () => ({
  getCachedLiveBroadcasts: mocks.getCachedLiveBroadcasts,
}));

import { GET } from "./route";

describe("GET /api/live", () => {
  afterEach(() => vi.restoreAllMocks());

  it("CHZZK 조회 없이 저장된 broadcasts와 refreshedAt을 반환함", async () => {
    const broadcast = {
      liveId: 1,
      title: "방송 제목",
      thumbnailUrl: "https://example.com/thumbnail.jpg",
      concurrentUserCount: 123,
      channelId: "channel-1",
      channelName: "스트리머",
    };
    mocks.getCachedLiveBroadcasts.mockResolvedValue({
      broadcasts: [broadcast],
      refreshedAt: "2026-09-12T10:00:00.000Z",
    });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      broadcasts: [broadcast],
      refreshedAt: "2026-09-12T10:00:00.000Z",
    });
    expect(mocks.getCachedLiveBroadcasts).toHaveBeenCalledTimes(1);
  });
});
