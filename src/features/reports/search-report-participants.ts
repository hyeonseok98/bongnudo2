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
  chzzkLiveUrl: string | null;
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

  const supabase = getSupabaseAdminClient();
  const result = await supabase.rpc("search_report_participants", {
    p_query: normalizedQuery,
    p_limit: 5,
  });

  if (result.error) {
    throw new ReportRequestError("인물 검색에 실패했습니다.", 500, {
      cause: result.error,
    });
  }

  const participants = reportParticipantSearchSchema.parse(result.data);
  const participantIds = participants.map(
    (participant) => participant.season_participant_id,
  );

  if (participantIds.length === 0) {
    return [];
  }

  const channelResult = await supabase
    .from("season_participants")
    .select(`
      id,
      streamer:streamers!inner (
        chzzk_channel_id
      )
    `)
    .in("id", participantIds);

  if (channelResult.error) {
    throw new ReportRequestError("인물 검색에 실패했습니다.", 500, {
      cause: channelResult.error,
    });
  }

  const chzzkChannelIds = new Map(
    channelResult.data.map(({ id, streamer }) => [
      id,
      streamer.chzzk_channel_id,
    ]),
  );

  return participants.map((participant) => ({
    seasonParticipantId: participant.season_participant_id,
    rpName: participant.rp_name,
    streamerName: participant.streamer_name,
    organizationName: participant.organization_name,
    profileImageUrl: getR2PublicUrl(participant.profile_image_key),
    role: participant.role,
    chzzkLiveUrl: createChzzkLiveUrl(
      chzzkChannelIds.get(participant.season_participant_id),
    ),
  }));
}

function createChzzkLiveUrl(channelId: string | null | undefined): string | null {
  const normalizedChannelId = channelId?.trim();

  return normalizedChannelId
    ? `https://chzzk.naver.com/live/${encodeURIComponent(normalizedChannelId)}`
    : null;
}
