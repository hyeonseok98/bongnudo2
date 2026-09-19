"use client";

import { useState, type ReactNode } from "react";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { parseAsInteger, useQueryState } from "nuqs";
import { LoaderCircle } from "lucide-react";

import { ArchiveGridSkeleton } from "@/components/archive-grid-skeleton";
import { Button } from "@/components/ui/button";
import { FilterBarSkeleton, MediaGridSkeleton } from "@/components/media-grid-skeleton";
import { RetryButton } from "@/components/ui/retry-button";
import type { ArchiveListItem } from "@/features/archives/archive";
import type { ClipItem, ClipListFilters } from "@/features/clips/clip";
import { getDefaultSeasonDayByDateTime } from "@/features/seasons/season-day";
import { archiveQueries } from "@/queries/archive-queries";
import { clipQueries } from "@/queries/clip-queries";
import { cn } from "@/utils/cn";

import { ArchiveClipCard } from "./archive-clip-card";
import {
  ArchiveClipPreviewDialog,
  type ArchiveClipPreviewItem,
} from "./archive-clip-preview-dialog";
import { ArchiveCard } from "./archive-card";

const archiveDayFilters: Omit<ClipListFilters, "day"> = {
  date: null,
  groups: [],
  jobs: [],
  participantIds: [],
  query: "",
  sort: "latest",
  tagIds: [],
};

export function ArchiveDayView() {
  const [selectedDay, setSelectedDay] = useQueryState("day", parseAsInteger);
  const [previewClip, setPreviewClip] = useState<ClipItem | null>(null);
  const optionsQuery = useQuery(archiveQueries.editorOptions());
  const day = selectedDay ?? getDefaultSeasonDayByDateTime(
    optionsQuery.data?.seasonDays ?? [],
    new Date(),
  )?.dayNumber ?? null;
  const seasonDayId = optionsQuery.data?.seasonDays.find(
    (seasonDay) => seasonDay.dayNumber === day,
  )?.id ?? null;
  const clipsQuery = useInfiniteQuery({
    ...clipQueries.list({ ...archiveDayFilters, day }),
    enabled: day !== null,
  });
  const relatedArchivesQuery = useQuery(archiveQueries.dayRelatedArchives(seasonDayId));
  const clips = clipsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const previewIndex = previewClip ? clips.findIndex((clip) => clip.id === previewClip.id) : -1;
  const nearbyItems: ArchiveClipPreviewItem[] = previewIndex < 0
    ? []
    : getCenteredItems(clips, previewIndex, 5).map((clip) => ({
      clip,
      id: clip.id,
      note: null,
    }));

  if (optionsQuery.isPending) {
    return <><FilterBarSkeleton /><MediaGridSkeleton /></>;
  }

  if (optionsQuery.isError || !optionsQuery.data) {
    return <ArchiveDayMessage>봉누도 일차를 불러오지 못했습니다.<RetryButton isPending={optionsQuery.isFetching} onRetry={() => void optionsQuery.refetch()} /></ArchiveDayMessage>;
  }

  return (
    <section aria-labelledby="archive-day-heading" className="space-y-7">
      <div>
        <h2 className="text-heading font-semibold text-primary" id="archive-day-heading">일자별 탐색</h2>
        <p className="mt-2 text-body text-secondary">봉누도 운영 일차별로 클립과 관련 아카이브를 살펴보세요.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="봉누도 일차">
        {optionsQuery.data.seasonDays.map((seasonDay) => (
          <Button
            aria-selected={day === seasonDay.dayNumber}
            className="shrink-0"
            key={seasonDay.id}
            onClick={() => void setSelectedDay(seasonDay.dayNumber, { history: "replace" })}
            size="sm"
            type="button"
            variant={day === seasonDay.dayNumber ? "default" : "outline"}
          >
            {seasonDay.dayNumber}일차
          </Button>
        ))}
      </div>

      {clipsQuery.isPending ? <MediaGridSkeleton /> : null}
      {clipsQuery.isError ? <ArchiveDayMessage>해당 일차의 클립을 불러오지 못했습니다.<RetryButton isPending={clipsQuery.isFetching} onRetry={() => void clipsQuery.refetch()} /></ArchiveDayMessage> : null}
      {!clipsQuery.isPending && !clipsQuery.isError ? (
        <>
          <section aria-labelledby="archive-day-clips-heading" className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-body-sm font-medium text-brand-text">선택한 일차</p>
                <h3 className="mt-1 text-heading-sm font-semibold text-primary" id="archive-day-clips-heading">봉누도 {day}일차 클립</h3>
              </div>
              <span
                aria-label="일자별 클립을 업데이트하는 중입니다."
                className={cn(
                  "inline-flex size-4 items-center justify-center text-tertiary",
                  !(clipsQuery.isFetching && !clipsQuery.isFetchingNextPage) && "invisible",
                )}
                role="status"
              >
                <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
                <span className="sr-only">일자별 클립을 업데이트하는 중입니다.</span>
              </span>
            </div>
            {clips.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {clips.map((clip) => (
                  <ArchiveClipCard clip={clip} key={clip.id} onPreview={() => setPreviewClip(clip)} />
                ))}
              </div>
            ) : <ArchiveDayMessage>이 일차에 아직 등록된 클립이 없습니다.</ArchiveDayMessage>}
            {clipsQuery.hasNextPage ? (
              <div className="flex justify-center">
                <Button
                  disabled={clipsQuery.isFetchingNextPage}
                  onClick={() => void clipsQuery.fetchNextPage()}
                  type="button"
                  variant="outline"
                >
                  {clipsQuery.isFetchingNextPage ? "클립을 더 불러오는 중입니다." : "클립 더 보기"}
                </Button>
              </div>
            ) : null}
          </section>

          <RelatedArchives
            archives={relatedArchivesQuery.data ?? []}
            isError={relatedArchivesQuery.isError}
            isPending={relatedArchivesQuery.isPending}
            onRetry={() => void relatedArchivesQuery.refetch()}
          />
        </>
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
    </section>
  );
}

function getCenteredItems<T>(items: T[], currentIndex: number, windowSize: number): T[] {
  const start = Math.min(
    Math.max(0, currentIndex - Math.floor(windowSize / 2)),
    Math.max(0, items.length - windowSize),
  );

  return items.slice(start, start + windowSize);
}

function RelatedArchives({
  archives,
  isError,
  isPending,
  onRetry,
}: {
  archives: ArchiveListItem[];
  isError: boolean;
  isPending: boolean;
  onRetry: () => void;
}) {
  return (
    <section aria-labelledby="day-related-archives-heading" className="space-y-4 border-t border-default pt-7">
      <div>
        <h3 className="text-body font-semibold text-primary" id="day-related-archives-heading">관련 아카이브</h3>
        <p className="mt-2 text-body text-secondary">이 일차의 클립을 포함한 공개 아카이브입니다.</p>
      </div>
      {isPending ? <ArchiveGridSkeleton count={3} /> : null}
      {isError ? <ArchiveDayMessage>관련 아카이브를 불러오지 못했습니다.<RetryButton onRetry={onRetry} /></ArchiveDayMessage> : null}
      {!isPending && !isError && archives.length === 0 ? (
        <ArchiveDayMessage>관련 공개 아카이브가 없습니다.</ArchiveDayMessage>
      ) : null}
      {archives.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {archives.map((archive) => <ArchiveCard archive={archive} key={archive.id} />)}
        </div>
      ) : null}
    </section>
  );
}

function ArchiveDayMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-default px-4 py-12 text-center text-body-sm text-secondary">
      {children}
    </div>
  );
}
