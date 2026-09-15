import type { ClipCursor } from "./clip";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseClipCursor(value: string | null): ClipCursor | null {
  if (!value) {
    return null;
  }

  const separatorIndex = value.lastIndexOf("|");

  if (separatorIndex === -1) {
    return null;
  }

  const clipCreatedAt = value.slice(0, separatorIndex);
  const id = value.slice(separatorIndex + 1);

  return Number.isNaN(Date.parse(clipCreatedAt)) || !UUID_PATTERN.test(id)
    ? null
    : { clipCreatedAt, id };
}

export function serializeClipCursor(cursor: ClipCursor): string {
  return `${cursor.clipCreatedAt}|${cursor.id}`;
}
