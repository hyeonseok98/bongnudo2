import "server-only";

import { getCurrentUser } from "@/features/auth/session";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export type CollectedMediaKind = "clip" | "replay";

export class CollectedMediaRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "CollectedMediaRequestError";
  }
}

export async function setCollectedMediaExclusion(
  kind: CollectedMediaKind,
  mediaId: string,
  isExcluded: boolean,
): Promise<void> {
  const user = await getCurrentUser();

  if (!user) {
    throw new CollectedMediaRequestError("로그인이 필요합니다.", 401);
  }

  if (user.status !== "active" || user.role !== "admin") {
    throw new CollectedMediaRequestError("관리자 권한이 필요합니다.", 403);
  }

  const supabase = getSupabaseAdminClient();
  const { data: seasons, error: seasonError } = await supabase
    .from("seasons")
    .select("id")
    .eq("is_active", true)
    .limit(2);

  if (seasonError || seasons.length !== 1) {
    throw new CollectedMediaRequestError("활성 시즌을 확인하지 못했습니다.", 500, {
      cause: seasonError,
    });
  }

  const values = {
    excluded_at: isExcluded ? new Date().toISOString() : null,
    excluded_by: isExcluded ? user.id : null,
  };
  const result = kind === "clip"
    ? await supabase
      .from("clips")
      .update(values)
      .eq("id", mediaId)
      .eq("season_id", seasons[0].id)
      .select("id")
      .maybeSingle()
    : await supabase
      .from("replays")
      .update(values)
      .eq("id", mediaId)
      .eq("season_id", seasons[0].id)
      .select("id")
      .maybeSingle();

  if (result.error) {
    throw new CollectedMediaRequestError("영상을 제외하지 못했습니다.", 500, {
      cause: result.error,
    });
  }

  if (!result.data) {
    throw new CollectedMediaRequestError("영상을 찾을 수 없습니다.", 404);
  }
}
