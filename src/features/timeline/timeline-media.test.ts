import { describe, expect, it } from "vitest";

import type { TimelineEvent, TimelineMedia } from "./timeline";
import {
  getInitialTimelineMediaId,
  getTimelineEventNeighbors,
  parseTimelineMediaFilter,
} from "./timeline-media";

describe("timeline media", () => {
  it("미디어 필터 값을 파싱하고 잘못된 값은 전체로 복구한다", () => {
    expect(parseTimelineMediaFilter("image")).toBe("image");
    expect(parseTimelineMediaFilter("clip")).toBe("clip");
    expect(parseTimelineMediaFilter("video")).toBe("all");
    expect(parseTimelineMediaFilter(null)).toBe("all");
  });

  it("목록 정렬과 무관하게 발생 시각 기준 이전·다음 이벤트를 찾는다", () => {
    const events = [
      createEvent("later", "2026-09-13T03:00:00.000Z", [createImage("3")]),
      createEvent("current", "2026-09-13T02:00:00.000Z", [createImage("2")]),
      createEvent("earlier", "2026-09-13T01:00:00.000Z", [createImage("1")]),
    ];

    const neighbors = getTimelineEventNeighbors(events, "current", "all");

    expect(neighbors.previous?.id).toBe("earlier");
    expect(neighbors.next?.id).toBe("later");
  });

  it("미디어 유형에 맞지 않거나 미디어가 없는 이벤트는 이동 대상에서 제외한다", () => {
    const events = [
      createEvent("image-before", "2026-09-13T01:00:00.000Z", [
        createImage("1"),
      ]),
      createEvent("current", "2026-09-13T02:00:00.000Z", [createClip("2")]),
      createEvent("empty", "2026-09-13T03:00:00.000Z", []),
      createEvent("clip-after", "2026-09-13T04:00:00.000Z", [createClip("4")]),
    ];

    expect(
      getTimelineEventNeighbors(events, "current", "clip").previous,
    ).toBeNull();
    expect(
      getTimelineEventNeighbors(events, "current", "clip").next?.id,
    ).toBe("clip-after");
    expect(getInitialTimelineMediaId(events[0], "clip")).toBe("1");
  });
});

function createEvent(
  id: string,
  occurredAt: string,
  media: TimelineMedia[],
): TimelineEvent {
  return {
    category: { name: "일상", slug: "daily" },
    content: "내용",
    id,
    media,
    occurredAt,
    participants: [],
    reportCount: 1,
    tags: [],
    title: id,
  };
}

function createImage(id: string): TimelineMedia {
  return { id, imageUrl: `https://example.com/${id}.webp`, mediaType: "image" };
}

function createClip(id: string): TimelineMedia {
  return {
    clipUrl: `https://chzzk.naver.com/clips/${id}clip00`,
    id,
    mediaType: "chzzk_clip",
  };
}
