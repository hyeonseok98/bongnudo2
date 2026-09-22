import { z } from "zod";

import type { ReportRequest } from "@/features/reports/report-validation";

const createReportResponseSchema = z.object({
  reportId: z.uuid(),
});

interface CreateReportResponse {
  reportId: string;
}

export async function postReport(
  request: ReportRequest,
): Promise<CreateReportResponse> {
  const response = await fetch("/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorBody: unknown = await response.json().catch(() => null);
    throw new Error(getErrorMessage(errorBody, "제보를 저장하지 못했습니다."));
  }

  const result = createReportResponseSchema.safeParse(await response.json().catch(() => null));

  if (!result.success) {
    throw new Error("제보 결과를 확인하지 못했습니다.");
  }

  return result.data;
}

function getErrorMessage(value: unknown, fallbackMessage: string): string {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error;
  }

  return fallbackMessage;
}
