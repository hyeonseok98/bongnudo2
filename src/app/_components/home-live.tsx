"use client";

import { useCharacters } from "@/app/characters/_hooks/use-characters";
import { LiveGrid, LiveGridSkeleton } from "@/app/live/_components/live-grid";
import { useLiveBroadcasts } from "@/app/live/_hooks/use-live-broadcasts";
import {
  buildLiveStreams,
  sortLiveStreams,
} from "@/app/live/_utils/live-directory";

import {
  HomeSectionHeader,
  HomeSectionMessage,
} from "./home-section";

const HOME_LIVE_COUNT = 3;

export function HomeLive() {
  const charactersQuery = useCharacters();
  const broadcastsQuery = useLiveBroadcasts();
  const streams = sortLiveStreams(
    buildLiveStreams(
      broadcastsQuery.data?.broadcasts ?? [],
      charactersQuery.data?.characters ?? [],
    ),
    "viewers",
  ).slice(0, HOME_LIVE_COUNT);
  const isPending =
    charactersQuery.isPending ||
    (broadcastsQuery.isPending && !broadcastsQuery.data);
  const isError =
    charactersQuery.isError ||
    (broadcastsQuery.isError && !broadcastsQuery.data);

  return (
    <section aria-labelledby="home-live-heading" className="space-y-4">
      <HomeSectionHeader
        description="지금 방송 중인 봉누도2 참가자를 확인해보세요."
        headingId="home-live-heading"
        href="/live"
        title="지금, LIVE"
      />

      {isPending ? (
        <LiveGridSkeleton count={HOME_LIVE_COUNT} />
      ) : isError ? (
        <HomeSectionMessage isError>
          실시간 방송을 불러오지 못했습니다.
        </HomeSectionMessage>
      ) : streams.length > 0 ? (
        <LiveGrid streams={streams} />
      ) : (
        <HomeSectionMessage>
          현재 방송 중인 참가자가 없습니다.
        </HomeSectionMessage>
      )}
    </section>
  );
}
