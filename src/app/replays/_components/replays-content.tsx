"use client";

import { useQueryClient } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";

import { useCharacters } from "@/app/characters/_hooks/use-characters";
import { Button } from "@/components/ui/button";
import { FilterBarSkeleton, MediaGridSkeleton } from "@/components/media-grid-skeleton";
import { RetryButton } from "@/components/ui/retry-button";
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

  return (
    <div className="space-y-6">
      <ReplaysHeading />
      {charactersQuery.isPending || optionsQuery.isPending ? <FilterBarSkeleton /> : null}
      {charactersQuery.isError || optionsQuery.isError ? (
        <ReplaysErrorState isRetrying={charactersQuery.isFetching || optionsQuery.isFetching} onRetry={() => {
          void charactersQuery.refetch();
          void optionsQuery.refetch();
        }} />
      ) : null}
      {charactersQuery.data && optionsQuery.data ? (
        <ReplayFilters
          characters={characters}
          date={directory.date}
          day={directory.day}
          groups={directory.groupSelection}
          jobs={directory.jobSelection}
          options={optionsQuery.data}
          participantIds={directory.participantIds}
          streamerAffiliations={streamerAffiliations}
          onDateChange={directory.changeDate}
          onDayChange={directory.changeDay}
          onGroupsApply={directory.applyGroups}
          onJobsApply={directory.applyJobs}
          onParticipantsChange={directory.changeParticipants}
          onReset={directory.resetFilters}
        />
      ) : null}
      {charactersQuery.data && optionsQuery.data && replaysQuery.isPending ? <MediaGridSkeleton /> : null}
      {charactersQuery.data && optionsQuery.data && !replaysQuery.isPending ? (
        <section aria-labelledby="replay-results-heading" className="space-y-4">
          <div>
            <h2 className="text-body-sm text-secondary" id="replay-results-heading">
              현재 불러온 다시보기 <strong className="font-semibold text-brand-text">{replays.length}개</strong>
            </h2>
            {replaysQuery.isFetching && !replaysQuery.isFetchingNextPage ? (
              <span aria-label="필터 결과를 업데이트하는 중입니다." className="ml-2 inline-flex align-middle text-tertiary" role="status">
                <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
                <span className="sr-only">필터 결과를 업데이트하는 중입니다.</span>
              </span>
            ) : null}
          </div>
          {replaysQuery.isError ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-status-danger/40 px-4 py-3" role="alert">
              <p className="text-body-sm text-status-danger">다시보기를 불러오지 못했습니다.</p>
              <RetryButton onRetry={() => void replaysQuery.refetch()} />
            </div>
          ) : null}
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
      ) : null}
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

function ReplaysErrorState({ isRetrying, onRetry }: { isRetrying: boolean; onRetry: () => void }) {
  return (
    <div className="space-y-4">
      <p className="text-body-sm text-status-danger" role="alert">다시보기 탐색 정보를 불러오지 못했습니다.</p>
      <RetryButton isPending={isRetrying} onRetry={onRetry} />
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
