import { z } from "zod";

import type { ReportCategory } from "@/features/reports/get-report-categories";

const reportCategoriesResponseSchema: z.ZodType<{
  categories: ReportCategory[];
}> = z.object({
  categories: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      slug: z.string(),
    }),
  ),
});

export async function getTimelineReportCategories(): Promise<ReportCategory[]> {
  const response = await fetch("/api/report-categories");

  if (!response.ok) {
    throw new Error("제보 분류를 불러오지 못했습니다.");
  }

  const data: unknown = await response.json();
  return reportCategoriesResponseSchema.parse(data).categories;
}
