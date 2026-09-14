import { describe, expect, it } from "vitest";

import {
  getSeason2DayNumber,
  getSeason2OperationalRange,
  isSeason2ClosedDate,
} from "./season2-operational-day";

describe("season2 operational day", () => {
  it("KST 18시를 운영일 경계로 사용한다", () => {
    expect(getSeason2DayNumber("2026-09-14T17:59:59+09:00")).toBeNull();
    expect(getSeason2DayNumber("2026-09-14T18:00:00+09:00")).toBe(1);
    expect(getSeason2DayNumber("2026-09-15T17:59:59+09:00")).toBe(1);
    expect(getSeason2DayNumber("2026-09-15T18:00:00+09:00")).toBe(2);
  });

  it("금요일 시작 운영일을 휴식일로 제외한다", () => {
    expect(isSeason2ClosedDate("2026-09-18")).toBe(true);
    expect(getSeason2DayNumber("2026-09-18T20:00:00+09:00")).toBeNull();
    expect(getSeason2OperationalRange(5)).toMatchObject({
      start: "2026-09-19T09:00:00.000Z",
      startDate: "2026-09-19",
    });
  });
});
