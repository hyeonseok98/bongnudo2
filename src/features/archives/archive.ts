export const ARCHIVE_CATEGORY_VALUES = ["character", "incident", "series", "other"] as const;
export const ARCHIVE_LIST_SORT_VALUES = ["updated", "published"] as const;
export const ARCHIVE_LIST_TYPE_VALUES = ["all", "system", "user"] as const;
export const ARCHIVE_STATUS_VALUES = ["ongoing", "completed"] as const;
export const MY_ARCHIVE_TAB_VALUES = ["owned", "edited", "deleted"] as const;

export type ArchiveCategory = (typeof ARCHIVE_CATEGORY_VALUES)[number];
export type ArchiveKind = "system_character" | "user";
export type ArchiveEditPolicy = "owner_only" | "public_edit";
export type ArchiveListSort = (typeof ARCHIVE_LIST_SORT_VALUES)[number];
export type ArchiveListType = (typeof ARCHIVE_LIST_TYPE_VALUES)[number];
export type ArchiveStatus = (typeof ARCHIVE_STATUS_VALUES)[number];
export type ArchiveStructureMode = "day_based" | "freeform";
export type ArchiveStoryType = "main" | "side";
export type ArchiveVisibility = "private" | "public";
export type MyArchiveTab = (typeof MY_ARCHIVE_TAB_VALUES)[number];

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
  storyType: ArchiveStoryType;
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
  storyType: ArchiveStoryType;
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
    endsAt: string;
    id: string;
    sessionDate: string;
    startsAt: string;
  }>;
  seasonId: number;
}

export interface ArchiveSystemParticipant {
  id: string;
  rpName: string | null;
  streamerName: string;
}

export interface ArchivePersonAffiliation {
  displayOrder: number;
  isPrimary: boolean;
  organizationName: string;
  organizationSlug: string;
  role: string | null;
}

export interface ArchivePersonDetail {
  participant: {
    affiliations: ArchivePersonAffiliation[];
    id: string;
    rpName: string | null;
    streamerName: string;
  };
  relatedArchives: ArchiveListItem[];
  systemArchiveId: string | null;
}

export interface ArchivePeopleSection {
  archives: ArchiveListItem[];
  participant: {
    id: string;
    rpName: string | null;
    streamerName: string;
  };
}

export interface ArchiveSystemClipSummary {
  clipCount: number;
  firstClipCreatedAt: string | null;
  lastClipCreatedAt: string | null;
  seasonDays: ArchiveSeasonDay[];
}

export interface ArchiveListCursor {
  id: string;
  sortAt: string;
}

export interface ArchiveListFilters {
  category: ArchiveCategory | null;
  participantId: string | null;
  query: string;
  sort: ArchiveListSort;
  status: ArchiveStatus | null;
  type: ArchiveListType;
}

export interface ArchiveListItem {
  archiveKind: ArchiveKind;
  category: ArchiveCategory;
  clipCount: number;
  description: string | null;
  firstClipCreatedAt: string | null;
  id: string;
  lastClipCreatedAt: string | null;
  ownerName: string | null;
  publishedAt: string | null;
  representativeImageUrl: string | null;
  sortAt: string;
  status: ArchiveStatus;
  systemParticipant: ArchiveSystemParticipant & {
    profileImageUrl: string | null;
  } | null;
  title: string;
  updatedAt: string;
}

export interface ArchivePage {
  items: ArchiveListItem[];
  nextCursor: ArchiveListCursor | null;
}

export interface MyArchiveCursor {
  id: string;
  sortAt: string;
}

export interface MyArchiveListItem {
  canEditContent: boolean;
  canRestore: boolean;
  clipCount: number;
  currentRevision: number;
  deletedAt: string | null;
  description: string | null;
  editPolicy: ArchiveEditPolicy;
  id: string;
  lastEditedByMeAt: string | null;
  ownerName: string | null;
  representativeImageUrl: string | null;
  restoreExpiresAt: string | null;
  sortAt: string;
  status: ArchiveStatus;
  structureMode: ArchiveStructureMode;
  title: string;
  updatedAt: string;
  visibility: ArchiveVisibility;
}

export interface MyArchivePage {
  items: MyArchiveListItem[];
  nextCursor: MyArchiveCursor | null;
}
