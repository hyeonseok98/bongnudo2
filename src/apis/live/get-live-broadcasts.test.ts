import { afterEach, describe, expect, it, vi } from "vitest";

import { getLiveBroadcasts } from "./get-live-broadcasts";

describe("getLiveBroadcasts", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("UTC offset이 포함된 정상 LIVE 응답을 반환함", async () => {
    const response = {
      broadcasts: [{
        liveId: 1,
        title: "방송 제목",
        thumbnailUrl: "https://example.com/thumbnail.jpg",
        concurrentUserCount: 123,
        channelId: "channel-1",
        channelName: "스트리머",
      }],
      refreshedAt: "2026-09-12T10:00:00.000000+00:00",
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(response)));

    await expect(getLiveBroadcasts()).resolves.toEqual(response);
  });

  it("빈 broadcasts를 정상 응답으로 반환함", async () => {
    const response = {
      broadcasts: [],
      refreshedAt: "2026-09-12T10:00:00+00:00",
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(response)));

    await expect(getLiveBroadcasts()).resolves.toEqual(response);
  });

  it("refreshedAt이 null인 응답을 정상 반환함", async () => {
    const response = {
      broadcasts: [],
      refreshedAt: null,
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(response)));

    await expect(getLiveBroadcasts()).resolves.toEqual(response);
  });
});
