import type { ReportRequest } from "@/features/reports/report-validation";

interface CreateReportResponse {
  reportId: string;
  timelineEventId: string | null;
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

  return response.json() as Promise<CreateReportResponse>;
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
