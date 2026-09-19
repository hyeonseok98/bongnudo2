"use client";

import { useCharacters } from "@/app/characters/_hooks/use-characters";
import { useReplays } from "@/app/replays/_hooks/use-replays";
import { MediaGridSkeleton } from "@/components/media-grid-skeleton";
import type { ReplayListFilters } from "@/features/replays/replay";

import { ReplayCardGrid } from "../replays/_components/replay-card";
import { HomeSectionHeader, HomeSectionMessage } from "./home-section";

const HOME_REPLAY_COUNT = 4;

const HOME_REPLAY_FILTERS: ReplayListFilters = {
  date: null,
  day: null,
  groups: [],
  jobs: [],
  participantIds: [],
  query: "",
};

export function HomeReplays() {
  const charactersQuery = useCharacters();
  const replaysQuery = useReplays(HOME_REPLAY_FILTERS);
  const replays = replaysQuery.data?.pages[0]?.items.slice(0, HOME_REPLAY_COUNT) ?? [];
  const participantProfileImages = new Map(
    (charactersQuery.data?.characters ?? []).map((character) => [
      character.id,
      {
        rpProfileImageUrl: character.rpProfileImageUrl ?? null,
        streamerProfileImageUrl: character.profileImageUrl,
      },
    ]),
  );

  return (
    <section aria-labelledby="home-replays-heading" className="space-y-4">
      <HomeSectionHeader
        description="봉누도2의 방송 기록을 다시 찾아보세요."
        headingId="home-replays-heading"
        href="/replays"
        title="다시보기"
      />
      {replaysQuery.isPending ? <MediaGridSkeleton count={HOME_REPLAY_COUNT} /> : null}
      {replaysQuery.isError ? (
        <HomeSectionMessage isError>다시보기를 불러오지 못했습니다.</HomeSectionMessage>
      ) : null}
      {!replaysQuery.isPending && !replaysQuery.isError && replays.length > 0 ? (
        <ReplayCardGrid
          participantProfileImages={participantProfileImages}
          replays={replays}
        />
      ) : null}
      {!replaysQuery.isPending && !replaysQuery.isError && replays.length === 0 ? (
        <HomeSectionMessage>아직 수집된 다시보기가 없습니다.</HomeSectionMessage>
      ) : null}
    </section>
  );
}
