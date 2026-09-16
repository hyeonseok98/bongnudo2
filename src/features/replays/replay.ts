export interface ReplayListFilters {
  date: string | null;
  day: number | null;
  groups: string[];
  jobs: string[];
  participantId: string | null;
  query: string;
}

export interface ReplayCursor {
  id: string;
  sortAt: string | null;
}

export interface ReplayAffiliation {
  organizationName: string;
  organizationSlug: string;
  role: string | null;
}

export interface ReplayParticipant {
  id: string;
  profileImageUrl: string | null;
  rpName: string | null;
  streamerName: string;
}

export interface ReplayItem {
  durationSeconds: number | null;
  historicalAffiliations: ReplayAffiliation[];
  id: string;
  liveStartedAt: string | null;
  participant: ReplayParticipant | null;
  publishedAt: string | null;
  replayUrl: string;
  seasonDay: {
    dayNumber: number;
    id: string;
    sessionDate: string;
  } | null;
  thumbnailUrl: string | null;
  title: string;
  viewCount: number | null;
}

export interface ReplayPage {
  items: ReplayItem[];
  nextCursor: ReplayCursor | null;
}

export interface ReplayOptions {
  seasonDays: Array<{
    dayNumber: number;
    id: string;
    sessionDate: string;
  }>;
}
