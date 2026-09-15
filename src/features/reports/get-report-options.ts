import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/server";

import type { ReportOptions, UserReportType } from "./report-options";

export async function getReportOptions(): Promise<ReportOptions> {
  const supabase = getSupabaseAdminClient();
  const categoriesResult = await supabase
    .from("report_categories")
    .select("id, name, report_type, slug")
    .in("report_type", ["bug", "idea"])
    .eq("is_active", true)
    .order("report_type", { ascending: true })
    .order("sort_order", { ascending: true });

  if (categoriesResult.error) {
    throw new Error("제보 선택 항목을 불러오지 못했습니다.", {
      cause: categoriesResult.error,
    });
  }

  return {
    categories: categoriesResult.data.flatMap((category) =>
      isUserReportType(category.report_type)
        ? [
            {
              id: category.id,
              name: category.name,
              reportType: category.report_type,
              slug: category.slug,
            },
          ]
        : [],
    ),
  };
}

function isUserReportType(value: string): value is UserReportType {
  return value === "bug" || value === "idea";
}
