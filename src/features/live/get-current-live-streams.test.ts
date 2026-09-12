import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: mocks.getSupabaseServerClient,
}));

import { getCurrentLiveStreams } from "./get-current-live-streams";

describe("getCurrentLiveStreams", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CHZZK_CLIENT_ID", "client-id");
    vi.stubEnv("CHZZK_CLIENT_SECRET", "client-secret");
    mocks.getSupabaseServerClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            data: [
              {
                id: "participant-1",
                streamer: { chzzk_channel_id: "channel-1" },
              },
              {
                id: "participant-without-channel",
                streamer: { chzzk_channel_id: null },
              },
            ],
            error: null,
          }),
        })),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("모든 페이지를 조회한 뒤 참가자의 LIVE만 반환함", async () => {
    const onMetrics = vi.fn();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(createChzzkResponse({
        data: [createChzzkLive("other-channel", 10)],
        next: "next-page",
      }))
      .mockResolvedValueOnce(createChzzkResponse({
        data: [createChzzkLive("channel-1", 321)],
        next: null,
      }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getCurrentLiveStreams({ onMetrics })).resolves.toEqual([
      {
        seasonParticipantId: "participant-1",
        liveStartedAt: null,
        broadcast: {
          liveId: 1,
          title: "방송 제목",
          thumbnailUrl: "https://example.com/thumbnail.jpg",
          concurrentUserCount: 321,
          channelId: "channel-1",
          channelName: "스트리머",
        },
      },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain("next=next-page");
    expect(onMetrics).toHaveBeenCalledWith(expect.objectContaining({
      matchedParticipantCount: 1,
      pageCount: 2,
      pageDurationsMs: [expect.any(Number), expect.any(Number)],
      totalLiveCount: 2,
    }));
  });

  it("후속 페이지 조회 실패 시 일부 LIVE 결과를 반환하지 않음", async () => {
    const onMetrics = vi.fn();
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(createChzzkResponse({
        data: [createChzzkLive("channel-1", 321)],
        next: "next-page",
      }))
      .mockResolvedValueOnce(new Response(null, { status: 503 })));

    await expect(getCurrentLiveStreams({ onMetrics })).rejects.toThrow(
      "치지직 LIVE API 요청에 실패함.",
    );
    expect(onMetrics).toHaveBeenLastCalledWith(expect.objectContaining({
      matchedParticipantCount: 1,
      pageCount: 2,
      totalLiveCount: 1,
    }));
  });
});

function createChzzkResponse({
  data,
  next,
}: {
  data: ReturnType<typeof createChzzkLive>[];
  next: string | null;
}) {
  return Response.json({
    code: 200,
    content: {
      data,
      page: { next },
    },
  });
}

function createChzzkLive(channelId: string, concurrentUserCount: number) {
  return {
    liveId: 1,
    liveTitle: "방송 제목",
    liveThumbnailImageUrl: "https://example.com/thumbnail.jpg",
    concurrentUserCount,
    channelId,
    channelName: "스트리머",
  };
}
