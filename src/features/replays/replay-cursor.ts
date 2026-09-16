import type { ReplayCursor } from "./replay";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseReplayCursor(value: string | null): ReplayCursor | null {
  if (!value) {
    return null;
  }

  const separatorIndex = value.lastIndexOf("|");

  if (separatorIndex === -1) {
    return null;
  }

  const sortAt = value.slice(0, separatorIndex) || null;
  const id = value.slice(separatorIndex + 1);

  return (sortAt !== null && Number.isNaN(Date.parse(sortAt))) || !UUID_PATTERN.test(id)
    ? null
    : { id, sortAt };
}

export function serializeReplayCursor(cursor: ReplayCursor): string {
  return `${cursor.sortAt ?? ""}|${cursor.id}`;
}
