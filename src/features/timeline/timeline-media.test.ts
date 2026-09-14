import { describe, expect, it } from "vitest";

import type { TimelineMedia } from "./timeline";
import {
  orderTimelineMedia,
  parseTimelineMediaFilter,
} from "./timeline-media";

describe("timeline media", () => {
  it("미디어 필터 값을 파싱하고 잘못된 값은 전체로 복구한다", () => {
    expect(parseTimelineMediaFilter("image")).toBe("image");
    expect(parseTimelineMediaFilter("clip")).toBe("clip");
    expect(parseTimelineMediaFilter("media")).toBe("media");
    expect(parseTimelineMediaFilter("video")).toBe("media");
    expect(parseTimelineMediaFilter(null)).toBe("media");
  });

  it("모든 클립을 모든 이미지보다 먼저 정렬한다", () => {
    const media = [
      createImage("image-1"),
      createClip("clip-1"),
      createImage("image-2"),
      createClip("clip-2"),
    ];

    expect(orderTimelineMedia(media).map((item) => item.id)).toEqual([
      "clip-1",
      "clip-2",
      "image-1",
      "image-2",
    ]);
  });
});

function createImage(id: string): TimelineMedia {
  return { id, imageUrl: `https://example.com/${id}.webp`, mediaType: "image" };
}

function createClip(id: string): TimelineMedia {
  return {
    clipUrl: `https://chzzk.naver.com/clips/${id}clip00`,
    id,
    mediaType: "chzzk_clip",
    thumbnailUrl: null,
  };
}
