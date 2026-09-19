import type { ArchiveClipSummary } from "@/features/archives/archive";

export type ArchiveWorkspaceDragData =
  | { chapterId: string; kind: "chapter"; surface: "flow" | "tabs" }
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
    const surface = Reflect.get(value, "surface");

    return typeof chapterId === "string" && (surface === "flow" || surface === "tabs");
  }

  return (kind === "chapter-drop" || kind === "item") && typeof chapterId === "string";
}
