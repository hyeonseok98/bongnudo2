import { NextResponse } from "next/server";

import { getPublicOrganization } from "@/apis/organizations/get-public-organizations";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const organization = await getPublicOrganization(slug);

    if (!organization) {
      return NextResponse.json(
        { message: "조직을 찾을 수 없음." },
        { status: 404 },
      );
    }

    const participantIds = organization.members.map(
      (member) => member.seasonParticipantId,
    );
    const chzzkChannelIds = await getChzzkChannelIds(participantIds);

    return NextResponse.json(
      {
        data: {
          ...organization,
          members: organization.members.map((member) => ({
            ...member,
            chzzkLiveUrl: createChzzkLiveUrl(
              chzzkChannelIds.get(member.seasonParticipantId),
            ),
          })),
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Failed to load public organization", error);

    return NextResponse.json(
      { message: "조직 정보를 불러오지 못함." },
      { status: 500 },
    );
  }
}

async function getChzzkChannelIds(
  participantIds: string[],
): Promise<Map<string, string | null>> {
  if (participantIds.length === 0) {
    return new Map();
  }

  const result = await getSupabaseServerClient()
    .from("season_participants")
    .select(`
      id,
      streamer:streamers!inner (
        chzzk_channel_id
      )
    `)
    .in("id", participantIds);

  if (result.error) {
    throw new Error("조직 정보를 불러오지 못함.", {
      cause: result.error,
    });
  }

  return new Map(
    result.data.map((row) => [row.id, row.streamer.chzzk_channel_id]),
  );
}

function createChzzkLiveUrl(channelId: string | null | undefined): string | null {
  const normalizedChannelId = channelId?.trim();

  return normalizedChannelId
    ? `https://chzzk.naver.com/live/${encodeURIComponent(normalizedChannelId)}`
    : null;
}
