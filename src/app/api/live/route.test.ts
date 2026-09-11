import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentLiveStreams: vi.fn(),
}));

vi.mock("@/features/live/get-current-live-streams", () => ({
  getCurrentLiveStreams: mocks.getCurrentLiveStreams,
}));

import { GET } from "./route";

describe("GET /api/live", () => {
  afterEach(() => vi.restoreAllMocks());

  it("공유 LIVE 조회 결과에서 기존 broadcasts 응답을 유지함", async () => {
    const broadcast = {
      liveId: 1,
      title: "방송 제목",
      thumbnailUrl: "https://example.com/thumbnail.jpg",
      concurrentUserCount: 123,
      channelId: "channel-1",
      channelName: "스트리머",
    };
    mocks.getCurrentLiveStreams.mockResolvedValue([
      { seasonParticipantId: "participant-1", broadcast },
    ]);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ broadcasts: [broadcast] });
  });
});
