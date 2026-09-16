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

  const sortAt = value.slice(0, separatorIndex);
  const id = value.slice(separatorIndex + 1);

  return Number.isNaN(Date.parse(sortAt)) || !UUID_PATTERN.test(id)
    ? null
    : { id, sortAt };
}

export function serializeArchiveCursor(cursor: ArchiveListCursor): string {
  return `${cursor.sortAt}|${cursor.id}`;
}
