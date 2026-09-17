import "server-only";

import { getCurrentUser } from "@/features/auth/session";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const MAX_CLIP_TAGS = 10;
const MAX_TAG_LENGTH = 20;

export interface ClipTag {
  canDelete: boolean;
  id: string;
  name: string;
}

export interface ClipTagSearchResult {
  id: string;
  name: string;
}

export class ClipTagRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ClipTagRequestError";
  }
}

export async function getClipTags(clipId: string): Promise<ClipTag[]> {
  const user = await getCurrentUser();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("clip_tags")
    .select(`
      created_by,
      tag:tags!inner (
        id,
        name
      )
    `)
    .eq("clip_id", clipId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new ClipTagRequestError("클립 태그를 불러오지 못했습니다.", 500, {
      cause: error,
    });
  }

  return data.map((row) => ({
    canDelete: user !== null && user.status === "active" && (
      user.id === row.created_by || user.role === "admin"
    ),
    id: row.tag.id,
    name: row.tag.name,
  }));
}

export async function searchClipTags(
  query: string,
  ids: string[],
): Promise<ClipTagSearchResult[]> {
  const supabase = getSupabaseAdminClient();
  let request = supabase.from("tags").select("id, name").order("name").limit(10);

  if (ids.length > 0) {
    request = request.in("id", ids);
  } else if (query) {
    request = request.ilike("normalized_name", `%${normalizeTagName(query)}%`);
  } else {
    return [];
  }

  const { data, error } = await request;

  if (error) {
    throw new ClipTagRequestError("태그를 검색하지 못했습니다.", 500, { cause: error });
  }

  return data;
}

export async function addClipTag(clipId: string, tagName: string): Promise<ClipTag[]> {
  const user = await requireActiveUser();
  const name = normalizeAndValidateTagName(tagName);
  const supabase = getSupabaseAdminClient();
  const { data: tag, error: tagError } = await supabase
    .from("tags")
    .upsert(
      { name, normalized_name: normalizeTagName(name) },
      { onConflict: "normalized_name" },
    )
    .select("id")
    .single();

  if (tagError) {
    throw new ClipTagRequestError("태그를 추가하지 못했습니다.", 500, { cause: tagError });
  }

  const { error } = await supabase
    .from("clip_tags")
    .upsert(
      { clip_id: clipId, created_by: user.id, tag_id: tag.id },
      { ignoreDuplicates: true, onConflict: "clip_id,tag_id" },
    );

  if (error) {
    if (error.message.includes("clip_tag_limit_exceeded")) {
      throw new ClipTagRequestError(`클립에는 태그를 최대 ${MAX_CLIP_TAGS}개까지 추가할 수 있습니다.`, 400, {
        cause: error,
      });
    }

    if (error.message.includes("clip_not_found")) {
      throw new ClipTagRequestError("클립을 찾을 수 없습니다.", 404, { cause: error });
    }

    throw new ClipTagRequestError("태그를 추가하지 못했습니다.", 500, { cause: error });
  }

  return getClipTags(clipId);
}

export async function deleteClipTag(clipId: string, tagId: string): Promise<void> {
  const user = await requireActiveUser();
  const supabase = getSupabaseAdminClient();
  const { data: clipTag, error: findError } = await supabase
    .from("clip_tags")
    .select("created_by")
    .eq("clip_id", clipId)
    .eq("tag_id", tagId)
    .maybeSingle();

  if (findError) {
    throw new ClipTagRequestError("클립 태그를 확인하지 못했습니다.", 500, {
      cause: findError,
    });
  }

  if (!clipTag) {
    throw new ClipTagRequestError("클립 태그를 찾을 수 없습니다.", 404);
  }

  if (clipTag.created_by !== user.id && user.role !== "admin") {
    throw new ClipTagRequestError("이 태그를 삭제할 권한이 없습니다.", 403);
  }

  const { error } = await supabase
    .from("clip_tags")
    .delete()
    .eq("clip_id", clipId)
    .eq("tag_id", tagId);

  if (error) {
    throw new ClipTagRequestError("클립 태그를 삭제하지 못했습니다.", 500, {
      cause: error,
    });
  }
}

function normalizeAndValidateTagName(value: string): string {
  const name = value.trim();

  if (!name) {
    throw new ClipTagRequestError("태그를 입력해주세요.", 400);
  }

  if (name.length > MAX_TAG_LENGTH) {
    throw new ClipTagRequestError(`태그는 최대 ${MAX_TAG_LENGTH}자까지 입력할 수 있습니다.`, 400);
  }

  return name;
}

function normalizeTagName(value: string): string {
  return value.trim().toLocaleLowerCase("ko-KR");
}

async function requireActiveUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new ClipTagRequestError("로그인이 필요합니다.", 401);
  }

  if (user.status !== "active") {
    throw new ClipTagRequestError("사용이 제한된 계정입니다.", 403);
  }

  return user;
}
