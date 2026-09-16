import { z } from "zod";

import type {
  ArchiveDetail,
  ArchiveEditorOptions,
  ArchiveSaveInput,
  ArchiveSaveResult,
} from "@/features/archives/archive";

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
    sortOrder: z.number().int().nonnegative(),
    title: z.string(),
  })),
  currentRevision: z.number().int().positive().nullable(),
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
  visibility: z.enum(["private", "public"]),
});

const archiveEditorOptionsSchema = z.object({
  seasonDays: z.array(z.object({
    dayNumber: z.number().int().positive(),
    id: z.uuid(),
    sessionDate: z.string().date(),
  })),
  seasonId: z.number().int().positive(),
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

export async function getArchiveEditorOptions(): Promise<ArchiveEditorOptions> {
  const response = await fetch("/api/archives/options", { cache: "no-store" });

  if (!response.ok) {
    throw new Error(await getArchiveErrorMessage(response, "아카이브 편집 정보를 불러오지 못했습니다."));
  }

  return archiveEditorOptionsSchema.parse(await response.json());
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

async function getArchiveErrorMessage(response: Response, fallback: string): Promise<string> {
  const result = z.object({ error: z.string() }).safeParse(await response.json());

  return result.success ? result.data.error : fallback;
}
