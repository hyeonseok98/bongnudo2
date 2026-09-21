import type { ReplayCursor } from "./replay";

const SESSION_GAP_MS = 15 * 60 * 1000;

export interface ReplaySessionSource {
  id: string;
  duration_seconds: number | null;
  live_started_at: string | null;
  season_day_id: string | null;
  season_participant_id: string | null;
  sort_at: string | null;
}

export interface ReplaySessionGroup {
  id: string;
  startedAt: string | null;
  endedAt: string | null;
  sortAt: string | null;
  replayIds: string[];
}

export function groupReplaySessions(rows: ReplaySessionSource[]): ReplaySessionGroup[] {
  const partitions = new Map<string, ReplaySessionSource[]>();
  const sessions: ReplaySessionGroup[] = [];

  for (const row of rows) {
    if (
      row.season_participant_id === null ||
      row.season_day_id === null ||
      row.live_started_at === null ||
      row.duration_seconds === null ||
      !Number.isFinite(Date.parse(row.live_started_at))
    ) {
      sessions.push({
        id: row.id,
        startedAt: row.live_started_at,
        endedAt: null,
        sortAt: row.sort_at,
        replayIds: [row.id],
      });
      continue;
    }

    const key = `${row.season_participant_id}:${row.season_day_id}`;
    const partition = partitions.get(key) ?? [];
    partition.push(row);
    partitions.set(key, partition);
  }

  for (const partition of partitions.values()) {
    partition.sort((left, right) =>
      Date.parse(left.live_started_at ?? "") - Date.parse(right.live_started_at ?? "") ||
      left.id.localeCompare(right.id),
    );

    let current: ReplaySessionGroup | null = null;
    let maxEnd = -Infinity;

    for (const row of partition) {
      const start = Date.parse(row.live_started_at ?? "");
      const end = start + Math.max(row.duration_seconds ?? 0, 0) * 1000;

      if (current === null || start > maxEnd + SESSION_GAP_MS) {
        current = {
          id: row.id,
          startedAt: row.live_started_at,
          endedAt: new Date(end).toISOString(),
          sortAt: row.live_started_at,
          replayIds: [row.id],
        };
        sessions.push(current);
        maxEnd = end;
        continue;
      }

      current.replayIds.push(row.id);
      if (end > maxEnd) {
        maxEnd = end;
        current.endedAt = new Date(end).toISOString();
      }
    }
  }

  return sessions.sort(compareReplaySessions);
}

export function pageReplaySessions(
  sessions: ReplaySessionGroup[],
  cursor: ReplayCursor | null,
  pageSize: number,
): { items: ReplaySessionGroup[]; nextCursor: ReplayCursor | null } {
  const afterCursor = cursor === null
    ? sessions
    : sessions.filter((session) => compareReplayCursors(
        { id: session.id, sortAt: session.sortAt },
        cursor,
      ) > 0);
  const items = afterCursor.slice(0, pageSize);
  const last = items.at(-1);

  return {
    items,
    nextCursor: afterCursor.length > pageSize && last
      ? { id: last.id, sortAt: last.sortAt }
      : null,
  };
}

function compareReplaySessions(left: ReplaySessionGroup, right: ReplaySessionGroup): number {
  return compareReplayCursors(
    { id: left.id, sortAt: left.sortAt },
    { id: right.id, sortAt: right.sortAt },
  );
}

function compareReplayCursors(left: ReplayCursor, right: ReplayCursor): number {
  if (left.sortAt === null) return right.sortAt === null ? right.id.localeCompare(left.id) : 1;
  if (right.sortAt === null) return -1;

  const timeDifference = Date.parse(right.sortAt) - Date.parse(left.sortAt);
  return timeDifference || right.id.localeCompare(left.id);
}
