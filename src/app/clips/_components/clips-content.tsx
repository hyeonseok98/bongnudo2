"use client";

import { LoaderCircle } from "lucide-react";
import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import {
  ArchiveClipPreviewDialog,
  type ArchiveClipPreviewItem,
} from "@/app/archives/_components/archive-clip-preview-dialog";
import { useCharacters } from "@/app/characters/_hooks/use-characters";
import { Select } from "@/components/ui/select";
import { RetryButton } from "@/components/ui/retry-button";
import { FilterBarSkeleton, MediaResultsSkeleton } from "@/components/media-grid-skeleton";
import type { ClipItem } from "@/features/clips/clip";
import { clipQueries } from "@/queries/clip-queries";
import { cn } from "@/utils/cn";

import { useClipDirectory } from "../_hooks/use-clip-directory";
import { useClipOptions, useClips } from "../_hooks/use-clips";
import { ClipCardGrid } from "./clip-card";
import { ClipFilters } from "./clip-filters";
import { ClipInfiniteScrollTrigger } from "./clip-infinite-scroll-trigger";

interface ClipsContentProps {
  canAddTags: boolean;
  canManageCollectedMedia: boolean;
}

export function ClipsContent({ canAddTags, canManageCollectedMedia }: ClipsContentProps) {
  const queryClient = useQueryClient();
  const directory = useClipDirectory({ supportsTagFilter: false });
  const charactersQuery = useCharacters();
  const optionsQuery = useClipOptions();
  const clipsQuery = useClips(directory.filters);
  const [previewClip, setPreviewClip] = useState<ClipItem | null>(null);
  const characters = charactersQuery.data?.characters ?? [];
  const streamerAffiliations = charactersQuery.data?.streamerAffiliations ?? [];
  const participantProfileImages = new Map(
    characters.map((character) => [
      character.id,
      {
        rpProfileImageUrl: character.rpProfileImageUrl ?? null,
        streamerProfileImageUrl: character.profileImageUrl,
      },
    ]),
  );
  const clips = clipsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const previewIndex = previewClip
    ? clips.findIndex((clip) => clip.id === previewClip.id)
    : -1;
  const nearbyItems: ArchiveClipPreviewItem[] = previewIndex < 0
    ? []
    : clips.slice(Math.max(0, previewIndex - 2), previewIndex + 3).map((clip) => ({
      clip,
      id: clip.id,
      note: null,
    }));

  function handleLoadMore() {
    if (!clipsQuery.hasNextPage || clipsQuery.isFetchingNextPage) {
      return;
    }

    void clipsQuery.fetchNextPage();
  }

  return (
    <div className="space-y-6">
      <ClipsHeading />
      {charactersQuery.isPending || optionsQuery.isPending ? <FilterBarSkeleton /> : null}
      {charactersQuery.isError || optionsQuery.isError ? (
        <ClipsErrorState isRetrying={charactersQuery.isFetching || optionsQuery.isFetching} onRetry={() => {
          void charactersQuery.refetch();
          void optionsQuery.refetch();
        }} />
      ) : null}
      {charactersQuery.data && optionsQuery.data ? (
        <ClipFilters
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

      {charactersQuery.data && optionsQuery.data && clipsQuery.isPending ? <MediaResultsSkeleton hasToolbarActions /> : null}
      {charactersQuery.data && optionsQuery.data && !clipsQuery.isPending ? (
        <section aria-labelledby="clip-results-heading" className="space-y-4">
          <div className="flex min-h-10 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-h-5 items-center gap-2">
              <h2 className="text-body-sm text-secondary" id="clip-results-heading">
                현재 불러온 클립 <strong className="font-medium text-primary">{clips.length}개</strong>
              </h2>
              <span
                aria-label="필터 결과를 업데이트하는 중입니다."
                className={cn(
                  "inline-flex size-4 items-center justify-center text-tertiary",
                  !(clipsQuery.isFetching && !clipsQuery.isFetchingNextPage) && "invisible",
                )}
                role="status"
              >
                <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
                <span className="sr-only">필터 결과를 업데이트하는 중입니다.</span>
              </span>
            </div>
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <span className="text-body-sm text-secondary">정렬</span>
              <Select
                className="w-32"
                label="클립 정렬"
                onValueChange={directory.changeSort}
                options={[
                  { label: "최신순", value: "latest" },
                  { label: "오래된순", value: "oldest" },
                ]}
                value={directory.sort}
              />
            </div>
          </div>

          {clipsQuery.isError ? (
            <QueryError onRetry={() => void clipsQuery.refetch()} />
          ) : null}

          {clips.length > 0 ? (
            <ClipCardGrid
              canAddTags={canAddTags}
              canManageCollectedMedia={canManageCollectedMedia}
              clips={clips}
              onExcluded={() => void queryClient.invalidateQueries({ queryKey: clipQueries.all() })}
              onPreview={setPreviewClip}
              participantProfileImages={participantProfileImages}
            />
          ) : (
            <ClipEmptyState />
          )}

          <ClipInfiniteScrollTrigger
            hasNextPage={clipsQuery.hasNextPage}
            isFetchingNextPage={clipsQuery.isFetchingNextPage}
            onLoadMore={handleLoadMore}
          />
        </section>
      ) : null}
      <ArchiveClipPreviewDialog
        clip={previewClip}
        hasNext={previewIndex >= 0 && previewIndex < clips.length - 1}
        hasPrevious={previewIndex > 0}
        nearbyItems={nearbyItems}
        onClose={() => setPreviewClip(null)}
        onNext={() => {
          if (previewIndex >= 0 && previewIndex < clips.length - 1) {
            setPreviewClip(clips[previewIndex + 1]);
          }
        }}
        onPrevious={() => {
          if (previewIndex > 0) {
            setPreviewClip(clips[previewIndex - 1]);
          }
        }}
        onSelect={(item) => {
          const nextClip = clips.find((clip) => clip.id === item.id);

          if (nextClip) {
            setPreviewClip(nextClip);
          }
        }}
      />
    </div>
  );
}

function ClipsHeading() {
  return (
    <div>
      <h1 className="text-title font-bold text-primary">클립</h1>
      <p className="mt-1 text-body text-secondary">
        봉누도2 참가자의 순간을 클립으로 찾아보세요.
      </p>
    </div>
  );
}

function ClipsErrorState({ isRetrying, onRetry }: { isRetrying: boolean; onRetry: () => void }) {
  return (
    <div className="space-y-4">
      <p className="text-body-sm text-status-danger" role="alert">
        클립 탐색 정보를 불러오지 못했습니다.
      </p>
      <RetryButton isPending={isRetrying} onRetry={onRetry} />
    </div>
  );
}

function QueryError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-status-danger/40 px-4 py-3" role="alert">
      <p className="text-body-sm text-status-danger">클립을 불러오지 못했습니다.</p>
      <RetryButton onRetry={onRetry} />
    </div>
  );
}

function ClipEmptyState() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center bg-surface-muted px-5 py-10 text-center">
      <p className="text-heading-sm font-semibold text-primary">
        조건에 맞는 클립이 없습니다.
      </p>
      <p className="mt-1 text-body-sm text-secondary">
        검색어나 선택한 필터를 변경해보세요.
      </p>
    </div>
  );
}
