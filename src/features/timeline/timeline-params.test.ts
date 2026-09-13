import { describe, expect, it } from "vitest";

import {
  createTimelineSearchParams,
  getCurrentKstDate,
  getKstDateRange,
  parseTimelineSearchParams,
  shiftKstDate,
} from "./timeline-params";

describe("timeline params", () => {
  it("KST 하루를 정확한 UTC 반개방 구간으로 변환한다", () => {
    expect(getKstDateRange("2026-09-13")).toEqual({
      start: "2026-09-12T15:00:00.000Z",
      end: "2026-09-13T15:00:00.000Z",
    });
  });

  it("UTC 날짜가 달라도 현재 KST 날짜를 반환한다", () => {
    expect(getCurrentKstDate(new Date("2026-09-12T16:00:00.000Z"))).toBe(
      "2026-09-13",
    );
  });

  it("월 경계를 넘어 날짜를 이동한다", () => {
    expect(shiftKstDate("2026-09-01", -1)).toBe("2026-08-31");
    expect(shiftKstDate("2026-09-30", 1)).toBe("2026-10-01");
  });

  it("URL 필터와 정렬을 파싱하고 다시 직렬화한다", () => {
    const filters = parseTimelineSearchParams(
      new URLSearchParams(
        "date=2026-09-13&q=%EB%8F%84%EC%8B%9C&category=daily&job=police&affiliation=group-a&participant=88d079c4-3074-40bd-956f-151b25d39a05&tag=news&sort=asc",
      ),
    );

    expect(filters).toMatchObject({
      date: "2026-09-13",
      query: "도시",
      category: "daily",
      job: "police",
      affiliation: "group-a",
      tag: "news",
      sort: "asc",
    });
    expect(createTimelineSearchParams(filters).get("sort")).toBe("asc");
  });

  it("잘못된 날짜와 정렬은 기본값으로 복구한다", () => {
    expect(
      parseTimelineSearchParams(
        new URLSearchParams("date=2026-02-30&sort=random"),
        "2026-09-13",
      ),
    ).toMatchObject({ date: "2026-09-13", sort: "desc" });
  });
});
