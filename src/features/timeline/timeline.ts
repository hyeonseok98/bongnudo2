export const TIMELINE_SORT_VALUES = ["desc", "asc"] as const;
export const TIMELINE_MEDIA_FILTER_VALUES = [
  "all",
  "clip",
  "image",
  "media",
] as const;
export const TIMELINE_VIEW_MODE_VALUES = ["date", "day"] as const;

export type TimelineSort = (typeof TIMELINE_SORT_VALUES)[number];
export type TimelineMediaFilter =
  (typeof TIMELINE_MEDIA_FILTER_VALUES)[number];
export type TimelineViewMode = (typeof TIMELINE_VIEW_MODE_VALUES)[number];

export interface TimelineQueryFilters {
  affiliation: string;
  category: string;
  date: string;
  day: number;
  job: string;
  participant: string;
  query: string;
  scope: "page" | "season";
  sort: TimelineSort;
  tag: string;
  viewMode: TimelineViewMode;
}

export interface TimelineCategory {
  name: string;
  slug: string;
}

export interface TimelineParticipant {
  isPrimary: boolean;
  profileImageUrl: string | null;
  rpName: string | null;
  seasonParticipantId: string;
  streamerName: string;
}

export interface TimelineTag {
  name: string;
  slug: string;
}

export interface TimelinePopularTag extends TimelineTag {
  usageCount: number;
}

interface TimelineImageMedia {
  id: string;
  mediaType: "image";
  imageUrl: string;
}

interface TimelineClipMedia {
  clipUrl: string;
  id: string;
  mediaType: "chzzk_clip";
}

export type TimelineMedia = TimelineImageMedia | TimelineClipMedia;

export interface TimelineEvent {
  category: TimelineCategory;
  content: string;
  createdAt: string;
  id: string;
  media: TimelineMedia[];
  occurredAt: string;
  participants: TimelineParticipant[];
  reportCount: number;
  tags: TimelineTag[];
  title: string;
}

export interface TimelinePageData {
  categories: TimelineCategory[];
  events: TimelineEvent[];
  isTruncated: boolean;
  popularTags: TimelinePopularTag[];
  totalCount: number;
}
