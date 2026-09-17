import type {
  ArchiveClipSummary,
  ArchiveContentInput,
  ArchiveDetail,
  ArchiveMetadataInput,
  ArchiveStoryType,
  ArchiveStructureMode,
} from "@/features/archives/archive";

export interface ArchiveDraftItem {
  clip: ArchiveClipSummary;
  id: string;
  note: string | null;
}

export interface ArchiveDraftChapter {
  description: string | null;
  id: string;
  items: ArchiveDraftItem[];
  seasonDayId: string | null;
  storyType: ArchiveStoryType;
  title: string;
}

export interface ArchiveEditorDraft {
  chapters: ArchiveDraftChapter[];
  metadata: ArchiveMetadataInput;
}

export interface ArchiveSeasonDay {
  dayNumber: number;
  id: string;
  sessionDate: string;
}

export function createArchiveDraft(detail: ArchiveDetail): ArchiveEditorDraft {
  if (detail.structureMode === null) {
    throw new Error("시스템 아카이브는 편집할 수 없습니다.");
  }

  return {
    chapters: detail.chapters.map((chapter) => ({
      description: chapter.description,
      id: chapter.id,
      items: chapter.items.map((item) => ({
        clip: item.clip,
        id: item.id,
        note: item.note,
      })),
      seasonDayId: chapter.seasonDayId,
      storyType: chapter.storyType,
      title: chapter.title,
    })),
    metadata: {
      category: detail.category,
      description: detail.description,
      editPolicy: detail.editPolicy,
      status: detail.status,
      structureMode: detail.structureMode,
      title: detail.title,
      visibility: detail.visibility,
    },
  };
}

export function createNewArchiveContent(
  structureMode: ArchiveStructureMode,
  seasonDays: ArchiveSeasonDay[],
): ArchiveContentInput {
  if (structureMode === "freeform") {
    return {
      chapters: [{
        description: null,
        items: [],
        seasonDayId: null,
        storyType: "main",
        title: "새 챕터",
      }],
    };
  }

  return {
    chapters: seasonDays.map((seasonDay) => ({
      description: null,
      items: [],
      seasonDayId: seasonDay.id,
      storyType: "main",
      title: `${seasonDay.dayNumber}일차 · ${seasonDay.sessionDate}`,
    })),
  };
}

export function toArchiveContentInput(draft: ArchiveEditorDraft): ArchiveContentInput {
  return {
    chapters: draft.chapters.map((chapter) => ({
      description: normalizeOptionalText(chapter.description),
      items: chapter.items.map((item) => ({
        clipId: item.clip.id,
        note: normalizeOptionalText(item.note),
      })),
      seasonDayId: chapter.seasonDayId,
      storyType: chapter.storyType,
      title: chapter.title.trim(),
    })),
  };
}

export function toArchiveMetadataInput(draft: ArchiveEditorDraft): ArchiveMetadataInput {
  return {
    ...draft.metadata,
    description: normalizeOptionalText(draft.metadata.description),
    title: draft.metadata.title.trim(),
  };
}

export function isArchiveDraftEqual(
  current: ArchiveEditorDraft,
  saved: ArchiveEditorDraft,
  canEditMetadata: boolean,
): boolean {
  const currentContent = toArchiveContentInput(current);
  const savedContent = toArchiveContentInput(saved);

  if (JSON.stringify(currentContent) !== JSON.stringify(savedContent)) {
    return false;
  }

  return !canEditMetadata || (
    JSON.stringify(toArchiveMetadataInput(current)) ===
    JSON.stringify(toArchiveMetadataInput(saved))
  );
}

function normalizeOptionalText(value: string | null): string | null {
  const normalized = value?.trim() ?? "";

  return normalized || null;
}
