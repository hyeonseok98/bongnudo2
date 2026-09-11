import type { QueryData } from "@supabase/supabase-js";
import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/supabase/server";

import type { LiveBroadcast } from "./live-stream";

const BONGNUDO2_SEASON_SLUG = "bongnudo-2";
const CHZZK_API_URL = "https://openapi.chzzk.naver.com/open/v1/lives";
const CHZZK_PAGE_SIZE = 20;

const chzzkLiveSchema = z.object({
  liveId: z.number().int(),
  liveTitle: z.string(),
  liveThumbnailImageUrl: z.string(),
  concurrentUserCount: z.number().int().nonnegative(),
  channelId: z.string().min(1),
  channelName: z.string(),
});

const chzzkLiveResponseSchema = z.object({
  code: z.number(),
  content: z.object({
    data: z.array(chzzkLiveSchema),
    page: z.object({
      next: z.string().nullable().optional(),
    }),
  }),
});

export interface CurrentLiveStream {
  seasonParticipantId: string;
  broadcast: LiveBroadcast;
}

function createParticipantChannelQuery() {
  return getSupabaseServerClient()
    .from("season_participants")
    .select(`
      id,
      seasons!season_participants_season_id_fkey!inner (),
      streamer:streamers!inner (chzzk_channel_id)
    `)
    .eq("seasons.slug", BONGNUDO2_SEASON_SLUG);
}

type ParticipantChannelQueryData = QueryData<
  ReturnType<typeof createParticipantChannelQuery>
>;

export async function getCurrentLiveStreams(): Promise<CurrentLiveStream[]> {
  const participantIdsByChannel = await getParticipantIdsByChannel();

  return getChzzkLiveStreams(participantIdsByChannel);
}

async function getParticipantIdsByChannel(): Promise<Map<string, string>> {
  const result = await createParticipantChannelQuery();

  if (result.error) {
    throw new Error("참가자 채널 정보를 불러오지 못함.", {
      cause: result.error,
    });
  }

  return new Map(result.data.flatMap(toParticipantChannelEntry));
}

function toParticipantChannelEntry(
  participant: ParticipantChannelQueryData[number],
): [string, string][] {
  return participant.streamer.chzzk_channel_id
    ? [[participant.streamer.chzzk_channel_id, participant.id]]
    : [];
}

async function getChzzkLiveStreams(
  participantIdsByChannel: Map<string, string>,
): Promise<CurrentLiveStream[]> {
  const clientId = process.env.CHZZK_CLIENT_ID;
  const clientSecret = process.env.CHZZK_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("치지직 환경변수가 설정되지 않음.");
  }

  const liveStreams: CurrentLiveStream[] = [];
  const visitedPageTokens = new Set<string>();
  let nextPageToken: string | null = null;

  do {
    const url = new URL(CHZZK_API_URL);
    url.searchParams.set("size", String(CHZZK_PAGE_SIZE));

    if (nextPageToken) {
      url.searchParams.set("next", nextPageToken);
    }

    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "Client-Id": clientId,
        "Client-Secret": clientSecret,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("치지직 LIVE API 요청에 실패함.");
    }

    const parsedResponse = chzzkLiveResponseSchema.parse(
      await response.json(),
    );

    for (const live of parsedResponse.content.data) {
      const seasonParticipantId = participantIdsByChannel.get(live.channelId);

      if (seasonParticipantId) {
        liveStreams.push({
          seasonParticipantId,
          broadcast: {
            liveId: live.liveId,
            title: live.liveTitle,
            thumbnailUrl: live.liveThumbnailImageUrl,
            concurrentUserCount: live.concurrentUserCount,
            channelId: live.channelId,
            channelName: live.channelName,
          },
        });
      }
    }

    nextPageToken = parsedResponse.content.page.next ?? null;

    if (nextPageToken && visitedPageTokens.has(nextPageToken)) {
      throw new Error("치지직 LIVE API 페이지 정보가 반복됨.");
    }

    if (nextPageToken) {
      visitedPageTokens.add(nextPageToken);
    }
  } while (nextPageToken);

  return liveStreams;
}
