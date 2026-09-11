import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { LiveStream } from "@/features/live/live-stream";

import { LiveCard } from "./live-card";

const stream: LiveStream = {
  broadcast: {
    liveId: 1,
    title: "한 줄 방송 제목",
    thumbnailUrl: "https://example.com/thumbnail.jpg",
    concurrentUserCount: 120,
    channelId: "broadcast-channel-id",
    channelName: "방송 채널명",
  },
  character: {
    id: "participant",
    streamerId: "streamer",
    chzzkChannelId: "participant-channel-id",
    slug: "streamer",
    streamerName: "스트리머",
    rpName: null,
    profileImageUrl: null,
    streamerAffiliations: [],
    affiliations: [],
  },
};

describe("LiveCard", () => {
  it("참가자의 치지직 채널로 연결하고 RP 정보가 없을 때 제목 높이를 예약하지 않음", () => {
    const { unmount } = render(<LiveCard stream={stream} />);

    expect(screen.getByRole("link", { name: "스트리머 방송 시청하기" }).getAttribute(
      "href",
    )).toBe(
      "https://chzzk.naver.com/live/participant-channel-id",
    );
    expect(screen.getByText("한 줄 방송 제목").className).toContain(
      "line-clamp-2",
    );
    expect(screen.getByText("한 줄 방송 제목").className).not.toContain(
      "min-h-",
    );
    expect(screen.getByText("스트리머").className).toContain("text-body-sm");
    expect(screen.getByText("한 줄 방송 제목").parentElement?.className).toBe(
      "space-y-2 p-3",
    );
    expect(screen.getByRole("article").className).toContain(
      "dark:hover:bg-surface-selected",
    );
    expect(screen.getByRole("article").className).toContain(
      "hover:border-brand",
    );
    expect(
      screen.getByRole("img", { name: "한 줄 방송 제목 방송 썸네일" })
        .className,
    ).toContain("dark:group-hover:brightness-105");
    expect(
      screen.getByRole("link", { name: "스트리머 방송 시청하기" })
        .className,
    ).toContain("focus-visible:outline-focus-ring");

    unmount();
  });

  it("RP 정보가 있으면 RP명과 스트리머명을 순서대로 표시함", () => {
    const { unmount } = render(
      <LiveCard
        stream={{
          ...stream,
          character: { ...stream.character, rpName: "RP 이름" },
        }}
      />,
    );

    expect(screen.getByText("RP 이름")).toBeTruthy();
    expect(screen.getAllByText("스트리머")[0].className).toContain(
      "text-body-sm",
    );

    unmount();
  });
});
