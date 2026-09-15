import "server-only";

import { z } from "zod";

import { getR2PublicUrl } from "@/lib/r2";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

import { ReportRequestError } from "./report-validation";

export interface ReportParticipantSearchResult {
  seasonParticipantId: string;
  rpName: string | null;
  streamerName: string;
  organizationName: string | null;
  profileImageUrl: string | null;
  role: string | null;
}

const reportParticipantSearchSchema = z.array(
  z.object({
    organization_name: z.string().nullable(),
    profile_image_key: z
      .string()
      .nullable()
      .optional()
      .transform((value) => value ?? null),
    role: z.string().nullable(),
    rp_name: z.string(),
    season_participant_id: z.string().uuid(),
    streamer_name: z.string(),
  }),
);

export async function searchReportParticipants(
  query: string,
): Promise<ReportParticipantSearchResult[]> {
  const normalizedQuery = query.trim();

  if (normalizedQuery.length === 0 || normalizedQuery.length > 100) {
    throw new ReportRequestError("검색어를 입력해주세요.");
  }

  const result = await getSupabaseAdminClient().rpc(
    "search_report_participants",
    {
      p_query: normalizedQuery,
      p_limit: 20,
    },
  );

  if (result.error) {
    throw new ReportRequestError("인물 검색에 실패했습니다.", 500, {
      cause: result.error,
    });
  }

  const participants = reportParticipantSearchSchema.parse(result.data);

  return participants.map((participant) => ({
    seasonParticipantId: participant.season_participant_id,
    rpName: participant.rp_name,
    streamerName: participant.streamer_name,
    organizationName: participant.organization_name,
    profileImageUrl: getR2PublicUrl(participant.profile_image_key),
    role: participant.role,
  }));
}
