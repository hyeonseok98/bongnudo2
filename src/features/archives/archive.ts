export type ArchiveCategory = "character" | "incident" | "series" | "other";
export type ArchiveEditPolicy = "owner_only" | "public_edit";
export type ArchiveStatus = "ongoing" | "completed";
export type ArchiveVisibility = "private" | "public";

export interface ArchiveMetadataInput {
  category: ArchiveCategory;
  description: string | null;
  editPolicy: ArchiveEditPolicy;
  status: ArchiveStatus;
  title: string;
  visibility: ArchiveVisibility;
}

export interface ArchiveContentInput {
  chapters: ArchiveChapterInput[];
}

export interface ArchiveChapterInput {
  description: string | null;
  items: ArchiveItemInput[];
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
  category: ArchiveCategory;
  chapters: ArchiveDetailChapter[];
  currentRevision: number;
  description: string | null;
  editPolicy: ArchiveEditPolicy;
  id: string;
  isOwner: boolean;
  seasonId: number;
  status: ArchiveStatus;
  title: string;
  visibility: ArchiveVisibility;
}

export interface ArchiveDetailChapter {
  description: string | null;
  id: string;
  items: ArchiveDetailItem[];
  sortOrder: number;
  title: string;
}

export interface ArchiveDetailItem {
  clipId: string;
  id: string;
  note: string | null;
  sortOrder: number;
}
