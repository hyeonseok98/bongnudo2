import "server-only";

import type { AuthenticatedUser } from "@/features/auth/session";
import type { Json } from "@/lib/supabase/database.types";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

import type {
  ArchiveCategory,
  ArchiveDetail,
  ArchiveEditPolicy,
  ArchiveSaveResult,
  ArchiveStatus,
  ArchiveVisibility,
} from "./archive";
import { ArchiveRequestError } from "./archive-error";
import {
  createArchiveRequestSchema,
  parseArchiveSnapshot,
  restoreArchiveRevisionRequestSchema,
  saveArchiveContentRequestSchema,
  toArchiveContentInput,
  toArchiveMetadataInput,
  updateArchiveMetadataRequestSchema,
} from "./archive-validation";

interface ArchiveRpcError {
  message: string;
}

export async function createArchive(
  user: AuthenticatedUser,
  rawRequest: unknown,
): Promise<ArchiveSaveResult> {
  const request = parseArchiveRequest(createArchiveRequestSchema, rawRequest);
  const supabase = getSupabaseAdminClient();
  const result = await supabase.rpc("create_archive", {
    p_actor_user_id: user.id,
    p_content: toArchiveContentJson(toArchiveContentInput(request.content)),
    p_metadata: toArchiveMetadataJson(toArchiveMetadataInput(request.metadata)),
    p_season_id: request.seasonId,
  });

  return toArchiveSaveResult(result.data, result.error);
}

export async function saveArchiveContent(
  user: AuthenticatedUser,
  archiveId: string,
  rawRequest: unknown,
): Promise<ArchiveSaveResult> {
  const request = parseArchiveRequest(saveArchiveContentRequestSchema, rawRequest);
  const supabase = getSupabaseAdminClient();
  const result = await supabase.rpc("save_archive_content", {
    p_actor_user_id: user.id,
    p_archive_id: archiveId,
    p_base_revision: request.baseRevision,
    p_content: toArchiveContentJson(toArchiveContentInput(request.content)),
  });

  return toArchiveSaveResult(result.data, result.error);
}

export async function updateArchiveMetadata(
  user: AuthenticatedUser,
  archiveId: string,
  rawRequest: unknown,
): Promise<ArchiveSaveResult> {
  const request = parseArchiveRequest(updateArchiveMetadataRequestSchema, rawRequest);
  const supabase = getSupabaseAdminClient();
  const result = await supabase.rpc("update_archive_metadata", {
    p_actor_user_id: user.id,
    p_archive_id: archiveId,
    p_base_revision: request.baseRevision,
    p_metadata: toArchiveMetadataJson(toArchiveMetadataInput(request.metadata)),
  });

  return toArchiveSaveResult(result.data, result.error);
}

export async function restoreArchiveRevision(
  user: AuthenticatedUser,
  archiveId: string,
  rawRequest: unknown,
): Promise<ArchiveSaveResult> {
  const request = parseArchiveRequest(restoreArchiveRevisionRequestSchema, rawRequest);
  const supabase = getSupabaseAdminClient();
  const result = await supabase.rpc("restore_archive_revision", {
    p_actor_user_id: user.id,
    p_archive_id: archiveId,
    p_base_revision: request.baseRevision,
    p_revision_number: request.revisionNumber,
  });

  return toArchiveSaveResult(result.data, result.error);
}

export async function softDeleteArchive(
  user: AuthenticatedUser,
  archiveId: string,
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const result = await supabase.rpc("soft_delete_archive", {
    p_actor_user_id: user.id,
    p_archive_id: archiveId,
  });

  if (result.error) {
    throwArchiveRpcError(result.error);
  }
}

export async function restoreArchive(
  user: AuthenticatedUser,
  archiveId: string,
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const result = await supabase.rpc("restore_archive", {
    p_actor_user_id: user.id,
    p_archive_id: archiveId,
  });

  if (result.error) {
    throwArchiveRpcError(result.error);
  }
}

export async function getArchiveDetail(
  archiveId: string,
  viewer: AuthenticatedUser | null,
): Promise<ArchiveDetail | null> {
  const supabase = getSupabaseAdminClient();
  const archiveResult = await supabase
    .from("archives")
    .select(`
      id,
      owner_id,
      season_id,
      title,
      description,
      category,
      visibility,
      edit_policy,
      status,
      current_revision,
      deleted_at
    `)
    .eq("id", archiveId)
    .maybeSingle();

  if (archiveResult.error) {
    throw new ArchiveRequestError("아카이브를 불러오지 못했습니다.", 500, {
      cause: archiveResult.error,
    });
  }

  const archive = archiveResult.data;

  if (
    !archive ||
    archive.deleted_at !== null ||
    (archive.visibility === "private" && archive.owner_id !== viewer?.id)
  ) {
    return null;
  }

  const [chaptersResult, itemsResult] = await Promise.all([
    supabase
      .from("archive_chapters")
      .select("id, title, description, sort_order")
      .eq("archive_id", archive.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("archive_items")
      .select("id, chapter_id, clip_id, note, sort_order")
      .eq("archive_id", archive.id)
      .order("sort_order", { ascending: true }),
  ]);

  if (chaptersResult.error || itemsResult.error) {
    throw new ArchiveRequestError("아카이브 콘텐츠를 불러오지 못했습니다.", 500, {
      cause: chaptersResult.error ?? itemsResult.error,
    });
  }

  const itemsByChapterId = new Map<string, ArchiveDetail["chapters"][number]["items"]>();

  for (const item of itemsResult.data) {
    const items = itemsByChapterId.get(item.chapter_id) ?? [];
    items.push({
      clipId: item.clip_id,
      id: item.id,
      note: item.note,
      sortOrder: item.sort_order,
    });
    itemsByChapterId.set(item.chapter_id, items);
  }

  return {
    category: toArchiveCategory(archive.category),
    chapters: chaptersResult.data.map((chapter) => ({
      description: chapter.description,
      id: chapter.id,
      items: itemsByChapterId.get(chapter.id) ?? [],
      sortOrder: chapter.sort_order,
      title: chapter.title,
    })),
    currentRevision: archive.current_revision,
    description: archive.description,
    editPolicy: toArchiveEditPolicy(archive.edit_policy),
    id: archive.id,
    isOwner: archive.owner_id === viewer?.id,
    seasonId: archive.season_id,
    status: toArchiveStatus(archive.status),
    title: archive.title,
    visibility: toArchiveVisibility(archive.visibility),
  };
}

function parseArchiveRequest<T>(schema: { safeParse: (value: unknown) => { data: T; success: true } | { error: { issues: Array<{ message: string }> }; success: false } }, value: unknown): T {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new ArchiveRequestError(result.error.issues[0]?.message ?? "아카이브 요청이 올바르지 않습니다.");
  }

  return result.data;
}

function toArchiveSaveResult(
  data: Array<{ archive_id: string; current_revision: number; snapshot: Json }> | null,
  error: ArchiveRpcError | null,
): ArchiveSaveResult {
  if (error) {
    throwArchiveRpcError(error);
  }

  const saved = data?.[0];

  if (!saved) {
    throw new ArchiveRequestError("아카이브를 저장하지 못했습니다.", 500);
  }

  return {
    archiveId: saved.archive_id,
    currentRevision: saved.current_revision,
    snapshot: parseArchiveSnapshot(saved.snapshot),
  };
}

function toArchiveContentJson(content: ReturnType<typeof toArchiveContentInput>): Json {
  return {
    chapters: content.chapters.map((chapter) => ({
      description: chapter.description,
      items: chapter.items.map((item) => ({
        clipId: item.clipId,
        note: item.note,
      })),
      title: chapter.title,
    })),
  };
}

function toArchiveMetadataJson(metadata: ReturnType<typeof toArchiveMetadataInput>): Json {
  return {
    category: metadata.category,
    description: metadata.description,
    editPolicy: metadata.editPolicy,
    status: metadata.status,
    title: metadata.title,
    visibility: metadata.visibility,
  };
}

function throwArchiveRpcError(error: ArchiveRpcError): never {
  switch (error.message) {
    case "archive_not_found":
    case "archive_revision_not_found":
      throw new ArchiveRequestError("아카이브를 찾을 수 없습니다.", 404, { cause: error });
    case "archive_content_forbidden":
    case "archive_metadata_forbidden":
    case "archive_user_not_active":
      throw new ArchiveRequestError("아카이브를 수정할 권한이 없습니다.", 403, { cause: error });
    case "archive_revision_conflict":
      throw new ArchiveRequestError(
        "다른 사용자가 먼저 수정했습니다. 최신 내용을 다시 불러온 뒤 확인해주세요.",
        409,
        { cause: error },
      );
    case "archive_cannot_be_private_after_publication":
      throw new ArchiveRequestError("공개한 아카이브는 비공개로 변경할 수 없습니다.", 400, {
        cause: error,
      });
    case "archive_restore_window_expired":
      throw new ArchiveRequestError("삭제 후 30일이 지난 아카이브는 복구할 수 없습니다.", 400, {
        cause: error,
      });
    case "archive_deleted":
      throw new ArchiveRequestError("삭제된 아카이브입니다.", 404, { cause: error });
    case "archive_duplicate_clip":
      throw new ArchiveRequestError("같은 클립을 중복해서 추가할 수 없습니다.", 400, {
        cause: error,
      });
    case "archive_clip_season_mismatch":
      throw new ArchiveRequestError("아카이브와 다른 시즌의 클립은 추가할 수 없습니다.", 400, {
        cause: error,
      });
    default:
      throw new ArchiveRequestError("아카이브를 저장하지 못했습니다.", 500, {
        cause: error,
      });
  }
}

function toArchiveCategory(value: string): ArchiveCategory {
  if (value === "character" || value === "incident" || value === "series" || value === "other") {
    return value;
  }

  throw new ArchiveRequestError("아카이브 정보가 올바르지 않습니다.", 500);
}

function toArchiveEditPolicy(value: string): ArchiveEditPolicy {
  if (value === "owner_only" || value === "public_edit") {
    return value;
  }

  throw new ArchiveRequestError("아카이브 정보가 올바르지 않습니다.", 500);
}

function toArchiveStatus(value: string): ArchiveStatus {
  if (value === "ongoing" || value === "completed") {
    return value;
  }

  throw new ArchiveRequestError("아카이브 정보가 올바르지 않습니다.", 500);
}

function toArchiveVisibility(value: string): ArchiveVisibility {
  if (value === "private" || value === "public") {
    return value;
  }

  throw new ArchiveRequestError("아카이브 정보가 올바르지 않습니다.", 500);
}
