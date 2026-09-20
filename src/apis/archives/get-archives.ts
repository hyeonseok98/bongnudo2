import { z } from "zod";

import type {
  ArchiveDetail,
  ArchiveEditorOptions,
  ArchiveListCursor,
  ArchiveListFilters,
  ArchiveListItem,
  MyArchiveCursor,
  MyArchivePage,
  MyArchiveTab,
  ArchivePage,
  ArchivePeopleSection,
  ArchivePeopleFilters,
  ArchivePeoplePage,
  ArchivePersonDetail,
  ArchiveSaveInput,
  ArchiveSaveResult,
  ArchiveSystemClipSummary,
} from "@/features/archives/archive";
import { serializeArchiveCursor } from "@/features/archives/archive-cursor";
import { serializeClipCursor } from "@/features/clips/clip-cursor";
import type { ClipCursor, ClipItem, ClipPage, ClipSort } from "@/features/clips/clip";

const archiveMetadataSchema = z.object({
  category: z.enum(["character", "incident", "series", "other"]),
  description: z.string().nullable(),
  editPolicy: z.enum(["owner_only", "public_edit"]),
  status: z.enum(["ongoing", "completed"]),
  structureMode: z.enum(["day_based", "freeform"]),
  title: z.string(),
  visibility: z.enum(["private", "public"]),
});

const archiveContentSchema = z.object({
  chapters: z.array(z.object({
    description: z.string().nullable(),
    items: z.array(z.object({
      clipId: z.uuid(),
      note: z.string().nullable(),
    })),
    seasonDayId: z.uuid().nullable(),
    storyType: z.enum(["main", "side"]),
    title: z.string(),
  })),
});

const archiveDetailSchema = z.object({
  archiveKind: z.enum(["system_character", "user"]),
  canEditContent: z.boolean(),
  canEditMetadata: z.boolean(),
  category: z.enum(["character", "incident", "series", "other"]),
  chapters: z.array(z.object({
    description: z.string().nullable(),
    id: z.uuid(),
    items: z.array(z.object({
      clip: z.object({
        clipCreatedAt: z.string().datetime({ offset: true }),
        clipUrl: z.string().url(),
        id: z.uuid(),
        participant: z.object({
          id: z.uuid(),
          profileImageUrl: z.string().url().nullable(),
          rpName: z.string().nullable(),
          streamerName: z.string(),
        }).nullable(),
        seasonDay: z.object({
          dayNumber: z.number().int().positive(),
          id: z.uuid(),
          sessionDate: z.string().date(),
        }).nullable(),
        thumbnailUrl: z.string().url().nullable(),
        title: z.string(),
      }),
      clipId: z.uuid(),
      id: z.uuid(),
      note: z.string().nullable(),
      sortOrder: z.number().int().nonnegative(),
    })),
    seasonDayId: z.uuid().nullable(),
    seasonDay: z.object({
      dayNumber: z.number().int().positive(),
      id: z.uuid(),
      sessionDate: z.string().date(),
    }).nullable(),
    sortOrder: z.number().int().nonnegative(),
    storyType: z.enum(["main", "side"]),
    title: z.string(),
  })),
  currentRevision: z.number().int().positive().nullable(),
  creatorName: z.string().nullable(),
  description: z.string().nullable(),
  editPolicy: z.enum(["owner_only", "public_edit"]),
  id: z.uuid(),
  isOwner: z.boolean(),
  seasonId: z.number().int().positive(),
  status: z.enum(["ongoing", "completed"]),
  structureMode: z.enum(["day_based", "freeform"]).nullable(),
  systemParticipant: z.object({
    id: z.uuid(),
    rpName: z.string().nullable(),
    streamerName: z.string(),
  }).nullable(),
  title: z.string(),
  updatedAt: z.string().datetime({ offset: true }),
  visibility: z.enum(["private", "public"]),
});

const systemArchiveClipSummarySchema = z.object({
  clipCount: z.number().int().nonnegative(),
  firstClipCreatedAt: z.string().datetime({ offset: true }).nullable(),
  lastClipCreatedAt: z.string().datetime({ offset: true }).nullable(),
  seasonDays: z.array(z.object({
    dayNumber: z.number().int().positive(),
    id: z.uuid(),
    sessionDate: z.string().date(),
  })),
});

const archiveClipPageSchema = z.object({
  items: z.array(z.object({
    clipCreatedAt: z.string().datetime({ offset: true }),
    clipUrl: z.string().url(),
    durationSeconds: z.number().int().nonnegative().nullable(),
    historicalAffiliations: z.array(z.object({
      organizationName: z.string(),
      organizationSlug: z.string(),
      role: z.string().nullable(),
    })),
    id: z.uuid(),
    participant: z.object({
      id: z.uuid(),
      profileImageUrl: z.string().url().nullable(),
      rpName: z.string().nullable(),
      streamerName: z.string(),
    }).nullable(),
    seasonDay: z.object({
      dayNumber: z.number().int().positive(),
      id: z.uuid(),
      sessionDate: z.string().date(),
    }).nullable(),
    tags: z.array(z.object({
      canDelete: z.boolean(),
      id: z.uuid(),
      name: z.string(),
    })),
    thumbnailUrl: z.string().url().nullable(),
    title: z.string(),
    viewCount: z.number().int().nonnegative().nullable(),
  })),
  nextCursor: z.object({
    clipCreatedAt: z.string().datetime({ offset: true }),
    id: z.uuid(),
  }).nullable(),
});

const archiveClipNeighborsSchema = z.object({
  items: archiveClipPageSchema.shape.items,
});

const archiveEditorOptionsSchema = z.object({
  seasonDays: z.array(z.object({
    dayNumber: z.number().int().positive(),
    endsAt: z.string().datetime({ offset: true }),
    id: z.uuid(),
    sessionDate: z.string().date(),
    startsAt: z.string().datetime({ offset: true }),
  })),
  seasonId: z.number().int().positive(),
});

const archivePageSchema = z.object({
  items: z.array(z.object({
    archiveKind: z.enum(["system_character", "user"]),
    category: z.enum(["character", "incident", "series", "other"]),
    clipCount: z.number().int().nonnegative(),
    description: z.string().nullable(),
    firstClipCreatedAt: z.string().datetime({ offset: true }).nullable(),
    id: z.uuid(),
    lastClipCreatedAt: z.string().datetime({ offset: true }).nullable(),
    ownerName: z.string().nullable(),
    publishedAt: z.string().datetime({ offset: true }).nullable(),
    representativeImageUrl: z.string().url().nullable(),
    sortAt: z.string().datetime({ offset: true }),
    status: z.enum(["ongoing", "completed"]),
    systemParticipant: z.object({
      id: z.uuid(),
      profileImageUrl: z.string().url().nullable(),
      rpName: z.string().nullable(),
      streamerName: z.string(),
    }).nullable(),
    title: z.string(),
    updatedAt: z.string().datetime({ offset: true }),
  })),
  nextCursor: z.object({
    id: z.uuid(),
    sortAt: z.string().datetime({ offset: true }),
  }).nullable(),
});

const archiveDayArchivesSchema = archivePageSchema.shape.items;

const archivePersonDetailSchema = z.object({
  participant: z.object({
    affiliations: z.array(z.object({
      displayOrder: z.number().int().nonnegative(),
      isPrimary: z.boolean(),
      organizationName: z.string(),
      organizationSlug: z.string(),
      role: z.string().nullable(),
    })),
    id: z.uuid(),
    rpName: z.string().nullable(),
    streamerName: z.string(),
  }),
  relatedArchives: archiveDayArchivesSchema,
  systemArchiveId: z.uuid().nullable(),
});

const archivePeopleSectionsSchema = z.array(z.object({
  archives: archiveDayArchivesSchema,
  participant: z.object({
    id: z.uuid(),
    rpName: z.string().nullable(),
    streamerName: z.string(),
  }),
}));

const archivePeoplePageSchema = z.object({
  items: archivePeopleSectionsSchema,
  nextCursor: z.uuid().nullable(),
});

const myArchivePageSchema = z.object({
  items: z.array(z.object({
    canEditContent: z.boolean(),
    canRestore: z.boolean(),
    clipCount: z.number().int().nonnegative(),
    currentRevision: z.number().int().positive(),
    deletedAt: z.string().datetime({ offset: true }).nullable(),
    description: z.string().nullable(),
    editPolicy: z.enum(["owner_only", "public_edit"]),
    id: z.uuid(),
    lastEditedByMeAt: z.string().datetime({ offset: true }).nullable(),
    ownerName: z.string().nullable(),
    representativeImageUrl: z.string().url().nullable(),
    restoreExpiresAt: z.string().datetime({ offset: true }).nullable(),
    sortAt: z.string().datetime({ offset: true }),
    status: z.enum(["ongoing", "completed"]),
    structureMode: z.enum(["day_based", "freeform"]),
    title: z.string(),
    updatedAt: z.string().datetime({ offset: true }),
    visibility: z.enum(["private", "public"]),
  })),
  nextCursor: z.object({
    id: z.uuid(),
    sortAt: z.string().datetime({ offset: true }),
  }).nullable(),
});

const archiveParticipantSearchSchema = z.object({
  participants: z.array(z.object({
    rpName: z.string().nullable(),
    seasonParticipantId: z.uuid(),
    streamerName: z.string(),
  })),
});

const archiveSaveResultSchema = z.object({
  archiveId: z.uuid(),
  currentRevision: z.number().int().positive(),
  snapshot: z.object({
    chapters: z.array(z.object({
      description: z.string().nullable(),
      id: z.uuid(),
      items: z.array(z.object({
        clipId: z.uuid(),
        id: z.uuid(),
        note: z.string().nullable(),
        sortOrder: z.number().int().nonnegative(),
      })),
      seasonDayId: z.uuid().nullable(),
      storyType: z.enum(["main", "side"]),
      sortOrder: z.number().int().nonnegative(),
      title: z.string(),
    })),
    metadata: z.object({
      category: z.enum(["character", "incident", "series", "other"]),
      description: z.string().nullable(),
      status: z.enum(["ongoing", "completed"]),
      title: z.string(),
    }),
  }),
});

export async function getArchive(archiveId: string): Promise<ArchiveDetail> {
  const response = await fetch(`/api/archives/${archiveId}`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(await getArchiveErrorMessage(response, "아카이브를 불러오지 못했습니다."));
  }

  return archiveDetailSchema.parse(await response.json());
}

export async function getPublicArchives(
  filters: ArchiveListFilters,
  cursor: ArchiveListCursor | null,
): Promise<ArchivePage> {
  const searchParams = new URLSearchParams();

  if (filters.type !== "all") searchParams.set("type", filters.type);
  if (filters.query) searchParams.set("q", filters.query);
  if (filters.participantId) searchParams.set("participant", filters.participantId);
  if (filters.category) searchParams.set("category", filters.category);
  if (filters.status) searchParams.set("status", filters.status);
  if (filters.sort !== "updated") searchParams.set("sort", filters.sort);
  if (cursor) searchParams.set("cursor", serializeArchiveCursor(cursor));

  const query = searchParams.toString();
  const response = await fetch(`/api/archives${query ? `?${query}` : ""}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await getArchiveErrorMessage(response, "공개 아카이브를 불러오지 못했습니다."));
  }

  return archivePageSchema.parse(await response.json());
}

export async function getPublicArchivesForSeasonDay(
  seasonDayId: string,
): Promise<ArchiveListItem[]> {
  const searchParams = new URLSearchParams({ seasonDay: seasonDayId });
  const response = await fetch(`/api/archives/day?${searchParams.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await getArchiveErrorMessage(response, "관련 아카이브를 불러오지 못했습니다."));
  }

  return archiveDayArchivesSchema.parse(await response.json());
}

export async function getArchivePersonDetail(
  participantId: string,
): Promise<ArchivePersonDetail> {
  const searchParams = new URLSearchParams({ participant: participantId });
  const response = await fetch(`/api/archives/person?${searchParams.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await getArchiveErrorMessage(response, "인물별 아카이브를 불러오지 못했습니다."));
  }

  return archivePersonDetailSchema.parse(await response.json());
}

const ARCHIVE_PEOPLE_PAGE_SIZE = 12;

export async function getArchivePeopleSections(
  filters: ArchivePeopleFilters,
  cursor: string | null,
): Promise<ArchivePeoplePage> {
  const searchParams = new URLSearchParams({
    limit: String(ARCHIVE_PEOPLE_PAGE_SIZE),
  });

  if (filters.query) searchParams.set("q", filters.query);
  if (cursor) searchParams.set("cursor", cursor);
  filters.jobs.forEach((job) => searchParams.append("job", job));
  filters.affiliations.forEach((affiliation) => searchParams.append("affiliation", affiliation));

  const response = await fetch(`/api/archives/people?${searchParams.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await getArchiveErrorMessage(response, "인물별 아카이브를 불러오지 못했습니다."));
  }

  return archivePeoplePageSchema.parse(await response.json());
}

export async function getMyArchives(
  tab: MyArchiveTab,
  cursor: MyArchiveCursor | null,
): Promise<MyArchivePage> {
  const searchParams = new URLSearchParams({ tab });

  if (cursor) searchParams.set("cursor", serializeArchiveCursor(cursor));

  const response = await fetch(`/api/me/archives?${searchParams.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await getArchiveErrorMessage(response, "내 아카이브를 불러오지 못했습니다."));
  }

  return myArchivePageSchema.parse(await response.json());
}

export interface ArchiveParticipantSearchResult {
  rpName: string | null;
  seasonParticipantId: string;
  streamerName: string;
}

export async function searchArchiveParticipants(
  query: string,
): Promise<ArchiveParticipantSearchResult[]> {
  const searchParams = new URLSearchParams({ query });
  const response = await fetch(`/api/report-participants?${searchParams.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await getArchiveErrorMessage(response, "인물을 검색하지 못했습니다."));
  }

  return archiveParticipantSearchSchema.parse(await response.json()).participants;
}

export async function getArchiveEditorOptions(): Promise<ArchiveEditorOptions> {
  const response = await fetch("/api/archives/options", { cache: "no-store" });

  if (!response.ok) {
    throw new Error(await getArchiveErrorMessage(response, "아카이브 편집 정보를 불러오지 못했습니다."));
  }

  return archiveEditorOptionsSchema.parse(await response.json());
}

export async function getSystemArchiveClipSummary(
  archiveId: string,
): Promise<ArchiveSystemClipSummary> {
  const response = await fetch(`/api/archives/${archiveId}/clip-summary`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await getArchiveErrorMessage(response, "시스템 아카이브 정보를 불러오지 못했습니다."));
  }

  return systemArchiveClipSummarySchema.parse(await response.json());
}

export async function getSystemArchiveClips(
  archiveId: string,
  {
    cursor,
    day,
    sort,
  }: {
    cursor: ClipCursor | null;
    day: number | null;
    sort: ClipSort;
  },
): Promise<ClipPage> {
  const searchParams = new URLSearchParams({ sort });

  if (day !== null) searchParams.set("day", String(day));
  if (cursor !== null) searchParams.set("cursor", serializeClipCursor(cursor));

  const response = await fetch(
    `/api/archives/${archiveId}/clips?${searchParams.toString()}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(await getArchiveErrorMessage(response, "시스템 아카이브 클립을 불러오지 못했습니다."));
  }

  return archiveClipPageSchema.parse(await response.json());
}

export async function getSystemArchiveClipNeighbors(
  archiveId: string,
  clipId: string,
  { day, sort }: { day: number | null; sort: ClipSort },
): Promise<ClipItem[]> {
  const searchParams = new URLSearchParams({ sort });

  if (day !== null) searchParams.set("day", String(day));

  const response = await fetch(
    `/api/archives/${archiveId}/clips/${clipId}/neighbors?${searchParams.toString()}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(await getArchiveErrorMessage(response, "주변 클립을 불러오지 못했습니다."));
  }

  return archiveClipNeighborsSchema.parse(await response.json()).items;
}

export async function createArchive(input: {
  content: ArchiveSaveInput["content"];
  metadata: ArchiveSaveInput["metadata"];
  seasonId: number;
}): Promise<ArchiveSaveResult> {
  const response = await fetch("/api/archives", {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(await getArchiveErrorMessage(response, "아카이브를 생성하지 못했습니다."));
  }

  return archiveSaveResultSchema.parse(await response.json());
}

export async function saveArchive(
  archiveId: string,
  input: ArchiveSaveInput,
): Promise<ArchiveSaveResult> {
  const response = await fetch(`/api/archives/${archiveId}`, {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "PUT",
  });

  if (!response.ok) {
    const message = await getArchiveErrorMessage(response, "아카이브를 저장하지 못했습니다.");
    const error = new Error(message);

    if (response.status === 409) {
      error.name = "ArchiveConflictError";
    }

    throw error;
  }

  return archiveSaveResultSchema.parse(await response.json());
}

export async function deleteArchive(archiveId: string): Promise<void> {
  const response = await fetch(`/api/archives/${archiveId}/delete`, { method: "POST" });

  if (!response.ok) {
    throw new Error(await getArchiveErrorMessage(response, "아카이브를 삭제하지 못했습니다."));
  }
}

export async function restoreArchive(archiveId: string): Promise<void> {
  const response = await fetch(`/api/archives/${archiveId}/restore`, { method: "POST" });

  if (!response.ok) {
    throw new Error(await getArchiveErrorMessage(response, "아카이브를 복구하지 못했습니다."));
  }
}

async function getArchiveErrorMessage(response: Response, fallback: string): Promise<string> {
  const result = z.object({ error: z.string() }).safeParse(await response.json());

  return result.success ? result.data.error : fallback;
}
