import { z } from "zod";

import type { ReportOptions } from "@/features/reports/report-options";

const reportOptionsResponseSchema: z.ZodType<ReportOptions> = z.object({
  categories: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      reportType: z.enum(["bug", "idea"]),
      slug: z.string(),
    }),
  ),
});

export async function getReportOptions(): Promise<ReportOptions> {
  const response = await fetch("/api/report-options");

  if (!response.ok) {
    throw new Error("제보 선택 항목을 불러오지 못했습니다.");
  }

  const data: unknown = await response.json();
  return reportOptionsResponseSchema.parse(data);
}
