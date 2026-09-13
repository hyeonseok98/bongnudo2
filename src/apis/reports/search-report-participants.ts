import type { ReportParticipantSearchResult } from "@/features/reports/search-report-participants";

interface SearchReportParticipantsResponse {
  participants: ReportParticipantSearchResult[];
}

export async function getReportParticipants(
  query: string,
): Promise<ReportParticipantSearchResult[]> {
  const searchParams = new URLSearchParams({ query });
  const response = await fetch(`/api/report-participants?${searchParams}`);

  if (!response.ok) {
    throw new Error("인물 검색에 실패했습니다.");
  }

  const data = (await response.json()) as SearchReportParticipantsResponse;
  return data.participants;
}
