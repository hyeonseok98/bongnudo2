import { z } from "zod";

import type {
  ArchiveContentInput,
  ArchiveMetadataInput,
  ArchiveSnapshot,
} from "./archive";
import { ArchiveRequestError } from "./archive-error";

const archiveMetadataSchema = z.strictObject({
  category: z.enum(["character", "incident", "series", "other"]),
  description: z.string().trim().max(5000).nullable(),
  editPolicy: z.enum(["owner_only", "public_edit"]),
  status: z.enum(["ongoing", "completed"]),
  title: z.string().trim().min(1, "제목을 입력해주세요.").max(160),
  visibility: z.enum(["private", "public"]),
}).refine(
  (metadata) => metadata.visibility !== "private" || metadata.editPolicy === "owner_only",
  "비공개 아카이브는 소유자만 편집할 수 있습니다.",
);

const archiveItemSchema = z.strictObject({
  clipId: z.uuid("클립 정보가 올바르지 않습니다."),
  note: z.string().trim().max(2000).nullable(),
});

const archiveChapterSchema = z.strictObject({
  description: z.string().trim().max(5000).nullable(),
  items: z.array(archiveItemSchema).max(500),
  title: z.string().trim().min(1, "챕터 제목을 입력해주세요.").max(160),
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

export const restoreArchiveRevisionRequestSchema = z.strictObject({
  baseRevision: revisionSchema,
  revisionNumber: z.number().int().positive("복구할 revision 정보가 올바르지 않습니다."),
});

export type CreateArchiveRequest = z.output<typeof createArchiveRequestSchema>;
export type SaveArchiveContentRequest = z.output<typeof saveArchiveContentRequestSchema>;
export type UpdateArchiveMetadataRequest = z.output<typeof updateArchiveMetadataRequestSchema>;
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
      sortOrder: z.number().int().nonnegative(),
      title: z.string(),
    }),
  ),
  metadata: z.strictObject({
    category: z.enum(["character", "incident", "series", "other"]),
    description: z.string().nullable(),
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

export function parseArchiveSnapshot(value: unknown): ArchiveSnapshot {
  const result = archiveSnapshotSchema.safeParse(value);

  if (!result.success) {
    throw new ArchiveRequestError("아카이브 저장 결과가 올바르지 않습니다.", 500);
  }

  return result.data;
}
