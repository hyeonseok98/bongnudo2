export type ArchiveCategory = "character" | "incident" | "series" | "other";
export type ArchiveKind = "system_character" | "user";
export type ArchiveEditPolicy = "owner_only" | "public_edit";
export type ArchiveStatus = "ongoing" | "completed";
export type ArchiveStructureMode = "day_based" | "freeform";
export type ArchiveVisibility = "private" | "public";

export interface ArchiveMetadataInput {
  category: ArchiveCategory;
  description: string | null;
  editPolicy: ArchiveEditPolicy;
  status: ArchiveStatus;
  structureMode: ArchiveStructureMode;
  title: string;
  visibility: ArchiveVisibility;
}

export interface ArchiveContentInput {
  chapters: ArchiveChapterInput[];
}

export interface ArchiveChapterInput {
  description: string | null;
  items: ArchiveItemInput[];
  seasonDayId: string | null;
  title: string;
}

export interface ArchiveItemInput {
  clipId: string;
  note: string | null;
}

export interface ArchiveSnapshot {
  chapters: ArchiveSnapshotChapter[];
  metadata: Pick<ArchiveMetadataInput, "category" | "description" | "status" | "title">;
}

export interface ArchiveSnapshotChapter extends ArchiveChapterInput {
  id: string;
  items: ArchiveSnapshotItem[];
  sortOrder: number;
}

export interface ArchiveSnapshotItem extends ArchiveItemInput {
  id: string;
  sortOrder: number;
}

export interface ArchiveSaveResult {
  archiveId: string;
  currentRevision: number;
  snapshot: ArchiveSnapshot;
}

export interface ArchiveDetail {
  archiveKind: ArchiveKind;
  category: ArchiveCategory;
  chapters: ArchiveDetailChapter[];
  currentRevision: number | null;
  description: string | null;
  editPolicy: ArchiveEditPolicy;
  id: string;
  isOwner: boolean;
  seasonId: number;
  status: ArchiveStatus;
  structureMode: ArchiveStructureMode | null;
  systemParticipant: ArchiveSystemParticipant | null;
  title: string;
  visibility: ArchiveVisibility;
}

export interface ArchiveDetailChapter {
  description: string | null;
  id: string;
  items: ArchiveDetailItem[];
  seasonDayId: string | null;
  sortOrder: number;
  title: string;
}

export interface ArchiveDetailItem {
  clipId: string;
  id: string;
  note: string | null;
  sortOrder: number;
}

export interface ArchiveSystemParticipant {
  id: string;
  rpName: string | null;
  streamerName: string;
}
