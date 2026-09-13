import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/server";

export interface ReportCategory {
  id: string;
  name: string;
  slug: string;
}

export async function getTimelineReportCategories(): Promise<ReportCategory[]> {
  const result = await getSupabaseAdminClient()
    .from("report_categories")
    .select("id, name, slug")
    .eq("report_type", "timeline")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (result.error) {
    throw new Error("제보 분류를 불러오지 못했습니다.", {
      cause: result.error,
    });
  }

  return result.data;
}
