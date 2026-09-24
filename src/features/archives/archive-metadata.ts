import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/server";

export interface PublicArchiveMetadata {
  description: string | null;
  id: string;
  title: string;
}

export async function getPublicArchiveMetadata(
  id: string,
): Promise<PublicArchiveMetadata | null> {
  const result = await getSupabaseAdminClient()
    .from("archives")
    .select("id, title, description")
    .eq("id", id)
    .eq("visibility", "public")
    .is("deleted_at", null)
    .maybeSingle();

  if (result.error) {
    throw new Error("공개 아카이브 정보를 불러오지 못함.", {
      cause: result.error,
    });
  }

  return result.data;
}

export function getArchiveDescription(description: string | null): string {
  const plainText = description
    ?.replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return plainText || "봉누도2의 기록을 모은 공개 아카이브입니다.";
}
