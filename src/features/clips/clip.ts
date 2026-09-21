export const CLIP_SORT_VALUES = ["latest", "oldest"] as const;

export type ClipSort = (typeof CLIP_SORT_VALUES)[number];

export interface ClipListFilters {
  date: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  day: number | null;
  groups: string[];
  jobs: string[];
  participantIds: string[];
  query: string;
  sort: ClipSort;
  tagIds: string[];
}

export interface ClipCursor {
  clipCreatedAt: string;
  id: string;
}

export interface ClipAffiliation {
  organizationName: string;
  organizationSlug: string;
  role: string | null;
}

export interface ClipParticipant {
  id: string;
  profileImageUrl: string | null;
  rpName: string | null;
  streamerName: string;
}

export interface ClipItem {
  clipCreatedAt: string;
  clipUrl: string;
  durationSeconds: number | null;
  historicalAffiliations: ClipAffiliation[];
  id: string;
  participant: ClipParticipant | null;
  seasonDay: {
    dayNumber: number;
    id: string;
    sessionDate: string;
  } | null;
  tags: Array<{
    canDelete: boolean;
    id: string;
    name: string;
  }>;
  thumbnailUrl: string | null;
  title: string;
  viewCount: number | null;
}

export interface ClipPage {
  items: ClipItem[];
  nextCursor: ClipCursor | null;
}

export interface ClipOptions {
  seasonDays: Array<{
    dayNumber: number;
    id: string;
    sessionDate: string;
  }>;
}

export function isClipSort(value: string): value is ClipSort {
  return CLIP_SORT_VALUES.some((sort) => sort === value);
}
