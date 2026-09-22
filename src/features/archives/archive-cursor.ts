import type { ArchiveListCursor } from "./archive";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseArchiveCursor(value: string | null): ArchiveListCursor | null {
  if (!value) {
    return null;
  }

  const separatorIndex = value.lastIndexOf("|");

  if (separatorIndex === -1) {
    return null;
  }

  const [sortAt, count] = value.slice(0, separatorIndex).split("|");
  const id = value.slice(separatorIndex + 1);

  if (count !== undefined && (!/^\d+$/.test(count) || !Number.isSafeInteger(Number(count)))) {
    return null;
  }

  return Number.isNaN(Date.parse(sortAt)) || !UUID_PATTERN.test(id)
    ? null
    : { id, sortAt, ...(count === undefined ? {} : { recommendationCount: Number(count) }) };
}

export function serializeArchiveCursor(cursor: ArchiveListCursor): string {
  return cursor.recommendationCount === undefined
    ? `${cursor.sortAt}|${cursor.id}`
    : `${cursor.sortAt}|${cursor.recommendationCount}|${cursor.id}`;
}
