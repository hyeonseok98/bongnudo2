"use client";

import { useQueryClient } from "@tanstack/react-query";

import { useCharacters } from "@/app/characters/_hooks/use-characters";
import { Button } from "@/components/ui/button";
import { replayQueries } from "@/queries/replay-queries";

import { useReplayDirectory } from "../_hooks/use-replay-directory";
import { useReplayOptions, useReplays } from "../_hooks/use-replays";
import { ReplayCardGrid } from "./replay-card";
import { ReplayFilters } from "./replay-filters";

interface ReplaysContentProps {
  canManageCollectedMedia: boolean;
}

export function ReplaysContent({ canManageCollectedMedia }: ReplaysContentProps) {
  const queryClient = useQueryClient();
  const directory = useReplayDirectory();
  const charactersQuery = useCharacters();
  const optionsQuery = useReplayOptions();
  const replaysQuery = useReplays(directory.filters);
  const characters = charactersQuery.data?.characters ?? [];
  const streamerAffiliations = charactersQuery.data?.streamerAffiliations ?? [];
  const replays = replaysQuery.data?.pages.flatMap((page) => page.items) ?? [];

  if (charactersQuery.isPending || optionsQuery.isPending) return <ReplaysLoadingState />;
  if (charactersQuery.isError || optionsQuery.isError) return <ReplaysErrorState />;

  return (
    <div className="space-y-6">
      <ReplaysHeading />
      <ReplayFilters
        characters={characters}
        date={directory.date}
        day={directory.day}
        groups={directory.groupSelection}
        jobs={directory.jobSelection}
        options={optionsQuery.data}
        participantId={directory.participantId}
        query={directory.query}
        streamerAffiliations={streamerAffiliations}
        onDateChange={directory.changeDate}
        onDayChange={directory.changeDay}
        onGroupsApply={directory.applyGroups}
        onJobsApply={directory.applyJobs}
        onParticipantChange={directory.changeParticipant}
        onQueryChange={directory.changeQuery}
        onReset={directory.resetFilters}
      />

      {replaysQuery.isPending ? (
        <p className="text-body-sm text-secondary" role="status">다시보기를 불러오는 중입니다.</p>
      ) : replaysQuery.isError ? (
        <p className="text-body-sm text-status-danger" role="alert">다시보기를 불러오지 못함.</p>
      ) : (
        <section aria-labelledby="replay-results-heading" className="space-y-4">
          <h2 className="text-body-sm text-secondary" id="replay-results-heading">
            현재 불러온 다시보기 <strong className="font-semibold text-brand-text">{replays.length}개</strong>
          </h2>
          {replays.length > 0 ? (
            <ReplayCardGrid
              canManageCollectedMedia={canManageCollectedMedia}
              onExcluded={() => void queryClient.invalidateQueries({ queryKey: replayQueries.all() })}
              replays={replays}
            />
          ) : <ReplayEmptyState />}
          {replaysQuery.hasNextPage ? (
            <div className="flex justify-center pt-2">
              <Button disabled={replaysQuery.isFetchingNextPage} onClick={() => void replaysQuery.fetchNextPage()} type="button" variant="outline">
                {replaysQuery.isFetchingNextPage ? "다시보기를 더 불러오는 중입니다." : "다시보기 더 보기"}
              </Button>
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}

function ReplaysHeading() {
  return (
    <div>
      <h1 className="text-title font-bold text-primary">다시보기</h1>
      <p className="mt-1 text-body text-secondary">봉누도2 참가자의 방송을 다시보기로 찾아보세요.</p>
    </div>
  );
}

function ReplaysLoadingState() {
  return (
    <div className="space-y-6">
      <ReplaysHeading />
      <p className="text-body-sm text-secondary" role="status">다시보기 탐색 정보를 불러오는 중입니다.</p>
    </div>
  );
}

function ReplaysErrorState() {
  return (
    <div className="space-y-6">
      <ReplaysHeading />
      <p className="text-body-sm text-status-danger" role="alert">다시보기 탐색 정보를 불러오지 못함.</p>
    </div>
  );
}

function ReplayEmptyState() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center bg-surface-muted px-5 py-10 text-center">
      <p className="text-heading-sm font-semibold text-primary">조건에 맞는 다시보기가 없습니다.</p>
      <p className="mt-1 text-body-sm text-secondary">검색어나 선택한 필터를 변경해보세요.</p>
    </div>
  );
}
