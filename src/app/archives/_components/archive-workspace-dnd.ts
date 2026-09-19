import type { ArchiveClipSummary } from "@/features/archives/archive";

export type ArchiveWorkspaceDragData =
  | { chapterId: null; kind: "chapter" }
  | { chapterId: string; kind: "chapter-drop" }
  | { chapterId: string; kind: "item" }
  | { chapterId: null; clip: ArchiveClipSummary; kind: "explorer-clip" };

export function isArchiveWorkspaceDragData(
  value: unknown,
): value is ArchiveWorkspaceDragData {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const kind = Reflect.get(value, "kind");
  const chapterId = Reflect.get(value, "chapterId");

  if (kind === "explorer-clip") {
    return chapterId === null && typeof Reflect.get(value, "clip") === "object";
  }

  if (kind === "chapter") {
    return chapterId === null;
  }

  return (kind === "chapter-drop" || kind === "item") && typeof chapterId === "string";
}
