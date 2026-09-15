import { describe, expect, it } from "vitest";

import type { TimelineQueryFilters } from "@/features/timeline/timeline";

import { timelineQueries } from "./timeline-queries";

const filters: TimelineQueryFilters = {
  affiliation: "",
  category: "daily",
  date: "2026-09-14",
  day: 0,
  job: "",
  participant: "",
  query: "",
  scope: "page",
  sort: "desc",
  tag: "",
  viewMode: "date",
};

describe("timelineQueries", () => {
  it("필터별 query key를 유지하고 짧은 staleTime 동안 결과를 재사용함", () => {
    const options = timelineQueries.list(filters);

    expect(options.queryKey).toEqual(["timeline", "list", filters]);
    expect(options.staleTime).toBe(60_000);
  });

  it("클립 URL별 썸네일을 하루 동안 재사용함", () => {
    const options = timelineQueries.clipThumbnail("https://chzzk.naver.com/clips/id");

    expect(options.queryKey).toEqual([
      "timeline",
      "clip-thumbnail",
      "https://chzzk.naver.com/clips/id",
    ]);
    expect(options.staleTime).toBe(86_400_000);
  });
});
