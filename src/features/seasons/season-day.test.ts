import { describe, expect, it } from "vitest";

import {
  getDefaultSeasonDayByDateTime,
  getSeasonDayByDateTime,
  getSeasonDayById,
  type SeasonDay,
} from "./season-day";

const seasonDays: SeasonDay[] = [
  {
    id: "day-1",
    seasonId: 2,
    dayNumber: 1,
    sessionDate: "2026-09-14",
    startsAt: "2026-09-14T09:00:00.000Z",
    endsAt: "2026-09-14T18:00:00.000Z",
  },
  {
    id: "day-2",
    seasonId: 2,
    dayNumber: 2,
    sessionDate: "2026-09-15",
    startsAt: "2026-09-15T09:00:00.000Z",
    endsAt: "2026-09-15T18:00:00.000Z",
  },
];

describe("season day", () => {
  it("운영 시작 시각을 해당 일차로 판정함", () => {
    expect(getSeasonDayByDateTime(seasonDays, "2026-09-14T09:00:00.000Z")).toMatchObject({
      id: "day-1",
    });
  });

  it("자정을 지난 운영 시간도 같은 일차로 판정함", () => {
    expect(getSeasonDayByDateTime(seasonDays, "2026-09-14T16:00:00.000Z")).toMatchObject({
      id: "day-1",
    });
  });

  it("운영 종료 시각은 다음 일차에 포함하지 않음", () => {
    expect(getSeasonDayByDateTime(seasonDays, "2026-09-14T18:00:00.000Z")).toBeNull();
  });

  it("다른 운영 일차를 구분함", () => {
    expect(getSeasonDayByDateTime(seasonDays, "2026-09-15T09:00:00.000Z")).toMatchObject({
      id: "day-2",
    });
  });

  it("식별자로 일차를 찾음", () => {
    expect(getSeasonDayById(seasonDays, "day-2")).toMatchObject({
      dayNumber: 2,
    });
  });

  it("기본 일차는 진행 중인 운영 일차를 선택함", () => {
    expect(getDefaultSeasonDayByDateTime(
      seasonDays,
      "2026-09-15T10:00:00.000Z",
    )).toMatchObject({ id: "day-2" });
  });

  it("휴식 시간에는 가장 최근 운영 일차를 선택함", () => {
    expect(getDefaultSeasonDayByDateTime(
      seasonDays,
      "2026-09-15T07:00:00.000Z",
    )).toMatchObject({ id: "day-1" });
  });

  it("시즌 종료 후에는 마지막 운영 일차를 선택함", () => {
    expect(getDefaultSeasonDayByDateTime(
      seasonDays,
      "2026-09-20T00:00:00.000Z",
    )).toMatchObject({ id: "day-2" });
  });
});
