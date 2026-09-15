import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { LiveStream } from "@/features/live/live-stream";
import { RpModeProvider } from "@/providers/rp-mode-provider";

import { LiveGrid } from "./live-grid";

const stream: LiveStream = {
  broadcast: {
    liveId: 21060986,
    title: "한 줄 방송 제목",
    thumbnailUrl: "https://example.com/thumbnail.jpg",
    concurrentUserCount: 120,
    channelId: "broadcast-channel-id",
    channelName: "방송 채널명",
  },
  character: {
    birthDate: null,
    id: "participant-one",
    streamerId: "streamer-one",
    chzzkChannelId: "participant-one-channel-id",
    slug: "streamer-one",
    streamerName: "첫 번째 스트리머",
    rpName: null,
    profileImageUrl: null,
    channelUrl: null,
    streamerAffiliations: [],
    affiliations: [],
    roleHistories: [],
    statedAge: null,
  },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("LiveGrid", () => {
  it("서로 다른 참가자가 같은 방송 ID를 가져도 중복 key 경고를 발생시키지 않음", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    render(
      <RpModeProvider
        initialSettings={{
          isRpMode: false,
          isLiveThumbnailBlurEnabled: false,
        }}
      >
        <LiveGrid
          streams={[
            stream,
            {
              ...stream,
              character: {
                ...stream.character,
                id: "participant-two",
                streamerId: "streamer-two",
                chzzkChannelId: "participant-two-channel-id",
                slug: "streamer-two",
                streamerName: "두 번째 스트리머",
              },
            },
          ]}
        />
      </RpModeProvider>,
    );

    expect(consoleError).not.toHaveBeenCalled();
  });
});
