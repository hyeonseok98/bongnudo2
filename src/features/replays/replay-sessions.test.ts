import { describe, expect, it } from "vitest";

import { groupReplaySessions, pageReplaySessions, type ReplaySessionSource } from "./replay-sessions";

const participantId = "participant";
const dayId = "day";

function replay(id: string, start: string | null, durationSeconds: number | null): ReplaySessionSource {
  return {
    id,
    duration_seconds: durationSeconds,
    live_started_at: start,
    season_day_id: dayId,
    season_participant_id: participantId,
    sort_at: start,
  };
}

describe("Replay 방송 세션", () => {
  it("종료 후 정확히 15분 이내는 묶고 16분은 분리한다", () => {
    const rows = [
      replay("a", "2026-09-19T09:00:00Z", 3600),
      replay("b", "2026-09-19T10:15:00Z", 3600),
      replay("c", "2026-09-19T11:31:00Z", 3600),
    ];

    expect(groupReplaySessions(rows).map((session) => session.replayIds)).toEqual([["c"], ["a", "b"]]);
  });

  it("각 재접속이 15분 이내면 연속해서 묶는다", () => {
    const rows = [
      replay("a", "2026-09-19T09:00:00Z", 3600),
      replay("b", "2026-09-19T10:10:00Z", 3600),
      replay("c", "2026-09-19T11:22:00Z", 3600),
    ];

    expect(groupReplaySessions(rows)[0].replayIds).toEqual(["a", "b", "c"]);
  });

  it("중첩 Replay는 세션의 최대 종료 시각으로 연결한다", () => {
    const rows = [
      replay("a", "2026-09-19T09:00:00Z", 3 * 3600),
      replay("b", "2026-09-19T10:00:00Z", 10 * 60),
      replay("c", "2026-09-19T12:12:00Z", 3600),
    ];

    expect(groupReplaySessions(rows)[0].replayIds).toEqual(["a", "b", "c"]);
  });

  it("시간이나 일차가 없으면 단독 세션을 만든다", () => {
    const noDay = { ...replay("c", "2026-09-19T09:05:00Z", 3600), season_day_id: null };
    const rows = [replay("a", "2026-09-19T09:00:00Z", null), replay("b", null, 3600), noDay];

    expect(groupReplaySessions(rows)).toHaveLength(3);
  });

  it("페이지 경계에서 세션을 나누거나 중복 반환하지 않는다", () => {
    const rows = [
      replay("a", "2026-09-19T09:00:00Z", 3600),
      replay("b", "2026-09-19T10:05:00Z", 3600),
      replay("c", "2026-09-19T13:00:00Z", 3600),
      replay("d", "2026-09-19T16:00:00Z", 3600),
    ];
    const sessions = groupReplaySessions(rows);
    const first = pageReplaySessions(sessions, null, 2);
    const second = pageReplaySessions(sessions, first.nextCursor, 2);

    expect(first.items.map((session) => session.replayIds)).toEqual([["d"], ["c"]]);
    expect(second.items.map((session) => session.replayIds)).toEqual([["a", "b"]]);
    expect(second.nextCursor).toBeNull();
  });
});
