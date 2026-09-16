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

export interface ArchiveSaveInput {
  baseRevision: number;
  content: ArchiveContentInput;
  metadata?: ArchiveMetadataInput;
}

export interface ArchiveDetail {
  archiveKind: ArchiveKind;
  canEditContent: boolean;
  canEditMetadata: boolean;
  category: ArchiveCategory;
  chapters: ArchiveDetailChapter[];
  creatorName: string | null;
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
  updatedAt: string;
  visibility: ArchiveVisibility;
}

export interface ArchiveDetailChapter {
  description: string | null;
  id: string;
  items: ArchiveDetailItem[];
  seasonDayId: string | null;
  seasonDay: ArchiveSeasonDay | null;
  sortOrder: number;
  title: string;
}

export interface ArchiveSeasonDay {
  dayNumber: number;
  id: string;
  sessionDate: string;
}

export interface ArchiveDetailItem {
  clip: ArchiveClipSummary;
  clipId: string;
  id: string;
  note: string | null;
  sortOrder: number;
}

export interface ArchiveClipSummary {
  clipCreatedAt: string;
  clipUrl: string;
  id: string;
  participant: {
    id: string;
    profileImageUrl: string | null;
    rpName: string | null;
    streamerName: string;
  } | null;
  seasonDay: {
    dayNumber: number;
    id: string;
    sessionDate: string;
  } | null;
  thumbnailUrl: string | null;
  title: string;
}

export interface ArchiveEditorOptions {
  seasonDays: Array<{
    dayNumber: number;
    id: string;
    sessionDate: string;
  }>;
  seasonId: number;
}

export interface ArchiveSystemParticipant {
  id: string;
  rpName: string | null;
  streamerName: string;
}

export interface ArchiveSystemClipSummary {
  clipCount: number;
  firstClipCreatedAt: string | null;
  lastClipCreatedAt: string | null;
  seasonDays: ArchiveSeasonDay[];
}
