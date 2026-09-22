import { z } from "zod";

import type {
  ArchiveContentInput,
  ArchiveListCursor,
  ArchiveListFilters,
  ArchiveMetadataInput,
  MyArchiveTab,
  ArchiveSaveInput,
  ArchiveSnapshot,
} from "./archive";
import { parseArchiveCursor } from "./archive-cursor";
import { ArchiveRequestError } from "./archive-error";

const archiveMetadataSchema = z.strictObject({
  category: z.enum(["character", "incident", "series", "other"]),
  description: z.string().trim().max(500).nullable(),
  editPolicy: z.enum(["owner_only", "public_edit"]),
  relatedParticipantIds: z.array(z.uuid("관련 인물 정보가 올바르지 않습니다.")).max(500),
  relatedSeasonDayIds: z.array(z.uuid("관련 일차 정보가 올바르지 않습니다.")).max(100),
  status: z.enum(["ongoing", "completed"]),
  structureMode: z.enum(["day_based", "freeform"]),
  title: z.string().trim().min(1, "제목을 입력해주세요.").max(60),
  visibility: z.enum(["private", "public"]),
}).superRefine((metadata, context) => {
  if (metadata.visibility === "private" && metadata.editPolicy !== "owner_only") {
    context.addIssue({
      code: "custom",
      message: "비공개 아카이브는 소유자만 편집할 수 있습니다.",
      path: ["editPolicy"],
    });
  }

  if (new Set(metadata.relatedParticipantIds).size !== metadata.relatedParticipantIds.length) {
    context.addIssue({
      code: "custom",
      message: "같은 인물을 중복해서 선택할 수 없습니다.",
      path: ["relatedParticipantIds"],
    });
  }

  if (new Set(metadata.relatedSeasonDayIds).size !== metadata.relatedSeasonDayIds.length) {
    context.addIssue({
      code: "custom",
      message: "같은 일차를 중복해서 선택할 수 없습니다.",
      path: ["relatedSeasonDayIds"],
    });
  }

  if (metadata.category === "character" && metadata.relatedParticipantIds.length === 0) {
    context.addIssue({
      code: "custom",
      message: "인물 아카이브는 관련 인물을 한 명 이상 선택해주세요.",
      path: ["relatedParticipantIds"],
    });
  }

  if (metadata.category === "incident" && metadata.relatedSeasonDayIds.length === 0) {
    context.addIssue({
      code: "custom",
      message: "사건 아카이브는 관련 일차를 한 개 이상 선택해주세요.",
      path: ["relatedSeasonDayIds"],
    });
  }
});

const archiveItemSchema = z.strictObject({
  clipId: z.uuid("클립 정보가 올바르지 않습니다."),
  note: z.string().trim().max(300).nullable(),
});

const archiveChapterSchema = z.strictObject({
  description: z.string().trim().max(300).nullable(),
  items: z.array(archiveItemSchema).max(500),
  seasonDayId: z.uuid().nullable(),
  storyType: z.enum(["main", "side"]),
  title: z.string().trim().min(1, "챕터 제목을 입력해주세요.").max(50),
});

const archiveContentSchema = z.strictObject({
  chapters: z.array(archiveChapterSchema).max(100),
}).superRefine((content, context) => {
  const clipIds = content.chapters.flatMap((chapter) => chapter.items.map((item) => item.clipId));

  if (clipIds.length > 500) {
    context.addIssue({
      code: "custom",
      message: "클립은 최대 500개까지 저장할 수 있습니다.",
      path: ["chapters"],
    });
  }

  if (new Set(clipIds).size !== clipIds.length) {
    context.addIssue({
      code: "custom",
      message: "같은 클립을 중복해서 추가할 수 없습니다.",
      path: ["chapters"],
    });
  }
});

const revisionSchema = z.number().int().nonnegative("수정 버전이 올바르지 않습니다.");

const archiveListQuerySchema = z.object({
  category: z.enum(["character", "incident", "series", "other"]).optional(),
  cursor: z.string().optional(),
  participant: z.uuid().optional(),
  q: z.string().trim().max(100, "검색어는 100자 이하로 입력해주세요.").optional(),
  sort: z.enum(["updated", "published", "recommended"]).optional(),
  status: z.enum(["ongoing", "completed"]).optional(),
  type: z.enum(["all", "system", "user"]).optional(),
});

const myArchiveListQuerySchema = z.object({
  cursor: z.string().optional(),
  tab: z.enum(["owned", "edited", "deleted"]).optional(),
});

export const createArchiveRequestSchema = z.strictObject({
  content: archiveContentSchema,
  metadata: archiveMetadataSchema,
  seasonId: z.number().int().positive("시즌 정보가 올바르지 않습니다."),
});

export const saveArchiveContentRequestSchema = z.strictObject({
  baseRevision: revisionSchema,
  content: archiveContentSchema,
});

export const updateArchiveMetadataRequestSchema = z.strictObject({
  baseRevision: revisionSchema,
  metadata: archiveMetadataSchema,
});

export const saveArchiveRequestSchema = z.strictObject({
  baseRevision: revisionSchema,
  content: archiveContentSchema,
  metadata: archiveMetadataSchema.optional(),
});

export const restoreArchiveRevisionRequestSchema = z.strictObject({
  baseRevision: revisionSchema,
  revisionNumber: z.number().int().positive("복구할 revision 정보가 올바르지 않습니다."),
});

export type CreateArchiveRequest = z.output<typeof createArchiveRequestSchema>;
export type SaveArchiveContentRequest = z.output<typeof saveArchiveContentRequestSchema>;
export type UpdateArchiveMetadataRequest = z.output<typeof updateArchiveMetadataRequestSchema>;
export type SaveArchiveRequest = z.output<typeof saveArchiveRequestSchema>;
export type RestoreArchiveRevisionRequest = z.output<typeof restoreArchiveRevisionRequestSchema>;

const archiveSnapshotSchema = z.strictObject({
  chapters: z.array(
    z.strictObject({
      description: z.string().nullable(),
      id: z.uuid(),
      items: z.array(
        z.strictObject({
          clipId: z.uuid(),
          id: z.uuid(),
          note: z.string().nullable(),
          sortOrder: z.number().int().nonnegative(),
        }),
      ),
      seasonDayId: z.uuid().nullable(),
      storyType: z.enum(["main", "side"]),
      sortOrder: z.number().int().nonnegative(),
      title: z.string(),
    }),
  ),
  metadata: z.strictObject({
    category: z.enum(["character", "incident", "series", "other"]),
    description: z.string().nullable(),
    relatedParticipantIds: z.array(z.uuid()),
    relatedSeasonDayIds: z.array(z.uuid()),
    status: z.enum(["ongoing", "completed"]),
    title: z.string(),
  }),
});

export function toArchiveMetadataInput(metadata: ArchiveMetadataInput): ArchiveMetadataInput {
  return {
    ...metadata,
    description: metadata.description || null,
  };
}

export function toArchiveContentInput(content: ArchiveContentInput): ArchiveContentInput {
  return {
    chapters: content.chapters.map((chapter) => ({
      ...chapter,
      description: chapter.description || null,
      items: chapter.items.map((item) => ({
        ...item,
        note: item.note || null,
      })),
    })),
  };
}

export function toArchiveSaveInput(input: ArchiveSaveInput): ArchiveSaveInput {
  return {
    baseRevision: input.baseRevision,
    content: toArchiveContentInput(input.content),
    metadata: input.metadata ? toArchiveMetadataInput(input.metadata) : undefined,
  };
}

export function parseArchiveSnapshot(value: unknown): ArchiveSnapshot {
  const result = archiveSnapshotSchema.safeParse(value);

  if (!result.success) {
    throw new ArchiveRequestError("아카이브 저장 결과가 올바르지 않습니다.", 500);
  }

  return result.data;
}

export function parseArchiveListRequest(searchParams: URLSearchParams): {
  cursor: ArchiveListCursor | null;
  filters: ArchiveListFilters;
} {
  const result = archiveListQuerySchema.safeParse({
    category: searchParams.get("category") ?? undefined,
    cursor: searchParams.get("cursor") ?? undefined,
    participant: searchParams.get("participant") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    type: searchParams.get("type") ?? undefined,
  });

  if (!result.success) {
    throw new ArchiveRequestError(
      result.error.issues[0]?.message ?? "아카이브 목록 조회 정보가 올바르지 않습니다.",
      400,
    );
  }

  const cursor = parseArchiveCursor(result.data.cursor ?? null);

  if (result.data.cursor && cursor === null) {
    throw new ArchiveRequestError("아카이브 목록 조회 정보가 올바르지 않습니다.", 400);
  }

  if (cursor && result.data.sort === "recommended" && cursor.recommendationCount === undefined) {
    throw new ArchiveRequestError("추천순 조회 정보가 올바르지 않음.", 400);
  }

  const type = result.data.type ?? "all";

  return {
    cursor,
    filters: {
      category: type === "user" ? result.data.category ?? null : null,
      participantId: result.data.participant ?? null,
      query: result.data.q ?? "",
      sort: result.data.sort ?? "updated",
      status: type === "user" ? result.data.status ?? null : null,
      type,
    },
  };
}

export function parseMyArchiveListRequest(searchParams: URLSearchParams): {
  cursor: ArchiveListCursor | null;
  tab: MyArchiveTab;
} {
  const result = myArchiveListQuerySchema.safeParse({
    cursor: searchParams.get("cursor") ?? undefined,
    tab: searchParams.get("tab") ?? undefined,
  });

  if (!result.success) {
    throw new ArchiveRequestError(
      result.error.issues[0]?.message ?? "내 아카이브 목록 조회 정보가 올바르지 않습니다.",
      400,
    );
  }

  const cursor = parseArchiveCursor(result.data.cursor ?? null);

  if (result.data.cursor && cursor === null) {
    throw new ArchiveRequestError("내 아카이브 목록 조회 정보가 올바르지 않습니다.", 400);
  }

  return { cursor, tab: result.data.tab ?? "owned" };
}
