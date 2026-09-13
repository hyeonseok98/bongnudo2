import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/server";

import { ReportRequestError } from "./report-validation";

export interface ReportParticipantSearchResult {
  seasonParticipantId: string;
  rpName: string | null;
  streamerName: string;
  organizationName: string | null;
  role: string | null;
}

export async function searchReportParticipants(
  query: string,
): Promise<ReportParticipantSearchResult[]> {
  const normalizedQuery = query.trim();

  if (normalizedQuery.length === 0 || normalizedQuery.length > 100) {
    throw new ReportRequestError("검색어를 입력해주세요.");
  }

  const supabase = getSupabaseAdminClient();
  const result = await supabase.rpc("search_report_participants", {
    p_query: normalizedQuery,
    p_limit: 20,
  });

  if (result.error) {
    throw new ReportRequestError("인물 검색에 실패했습니다.", 500, {
      cause: result.error,
    });
  }

  return result.data.map((participant) => ({
    seasonParticipantId: participant.season_participant_id,
    rpName: participant.rp_name,
    streamerName: participant.streamer_name,
    organizationName: participant.organization_name,
    role: participant.role,
  }));
}
