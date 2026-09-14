import { describe, expect, it } from "vitest";

import type { TimelineEvent, TimelineMedia } from "./timeline";
import {
  compareTimelineEvents,
  getTimelineEventNeighbors,
  resolveTimelineEvent,
} from "./timeline-event-navigation";

describe("timeline event navigation", () => {
  it("탐색 결과가 비어도 목록에서 확보한 현재 이벤트를 유지한다", () => {
    const current = createEvent("current", "2026-09-14T03:00:00.000Z", []);

    expect(resolveTimelineEvent([current], [], current.id)).toBe(current);
  });

  it("현재 이벤트가 탐색 후보에 없어도 날짜 경계를 넘어 이웃을 찾는다", () => {
    const current = createEvent("current", "2026-09-14T14:50:00.000Z", [
      createImage("current-image"),
    ]);
    const next = createEvent("next-day", "2026-09-15T00:10:00.000Z", [
      createImage("next-image"),
    ]);

    expect(getTimelineEventNeighbors([next], current, "media").next).toBe(next);
  });

  it("클립+사진 탐색에서는 텍스트 전용 기록을 제외한다", () => {
    const current = createEvent("current", "2026-09-14T03:00:00.000Z", []);
    const text = createEvent("text", "2026-09-14T04:00:00.000Z", []);
    const image = createEvent("image", "2026-09-14T05:00:00.000Z", [
      createImage("image-1"),
    ]);

    expect(getTimelineEventNeighbors([text, image], current, "media").next).toBe(
      image,
    );
  });

  it("같은 발생 시각은 생성 시각과 id 순서로 결정한다", () => {
    const earlier = createEvent("a", "2026-09-13T02:00:00.000Z", []);
    const later = {
      ...createEvent("b", "2026-09-13T02:00:00.000Z", []),
      createdAt: "2026-09-13T03:00:00.000Z",
    };

    expect(compareTimelineEvents(earlier, later)).toBeLessThan(0);
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
    createdAt: "2026-09-13T01:00:00.000Z",
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
