"use client";

import { useState } from "react";

import { useInfiniteQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import type { ClipItem, ClipListFilters } from "@/features/clips/clip";
import { clipQueries } from "@/queries/clip-queries";

import { useClipOptions } from "../../clips/_hooks/use-clips";
import { ArchiveClipCard } from "./archive-clip-card";
import { ArchiveClipPreviewDialog } from "./archive-clip-preview-dialog";

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
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [previewClip, setPreviewClip] = useState<ClipItem | null>(null);
  const optionsQuery = useClipOptions();
  const day = selectedDay ?? optionsQuery.data?.seasonDays[0]?.dayNumber ?? null;
  const clipsQuery = useInfiniteQuery({
    ...clipQueries.list({ ...archiveDayFilters, day }),
    enabled: day !== null,
  });
  const clips = clipsQuery.data?.pages.flatMap((page) => page.items) ?? [];

  if (optionsQuery.isPending) {
    return <ArchiveDayMessage>봉누도 일차를 불러오는 중입니다.</ArchiveDayMessage>;
  }

  if (optionsQuery.isError || !optionsQuery.data) {
    return <ArchiveDayMessage>봉누도 일차를 불러오지 못했습니다.</ArchiveDayMessage>;
  }

  return (
    <section aria-labelledby="archive-day-heading" className="space-y-5">
      <div>
        <h2 className="text-heading font-semibold text-primary" id="archive-day-heading">일자별 탐색</h2>
        <p className="mt-1 text-body-sm text-secondary">선택한 봉누도 일차의 클립을 살펴보세요.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="봉누도 일차">
        {optionsQuery.data.seasonDays.map((seasonDay) => (
          <Button
            aria-selected={day === seasonDay.dayNumber}
            className="shrink-0"
            key={seasonDay.id}
            onClick={() => setSelectedDay(seasonDay.dayNumber)}
            size="sm"
            type="button"
            variant={day === seasonDay.dayNumber ? "default" : "outline"}
          >
            {seasonDay.dayNumber}일차
          </Button>
        ))}
      </div>

      {clipsQuery.isPending ? <ArchiveDayMessage>클립을 불러오는 중입니다.</ArchiveDayMessage> : null}
      {clipsQuery.isError ? <ArchiveDayMessage>해당 일차의 클립을 불러오지 못했습니다.</ArchiveDayMessage> : null}
      {!clipsQuery.isPending && !clipsQuery.isError ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-body font-semibold text-primary">봉누도 {day}일차</h3>
            <span className="text-caption text-secondary">현재 불러온 클립 {clips.length}개</span>
          </div>
          {clips.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {clips.map((clip) => (
                <ArchiveClipCard clip={clip} key={clip.id} onPreview={() => setPreviewClip(clip)} />
              ))}
            </div>
          ) : <ArchiveDayMessage>해당 일차에 등록된 클립이 없습니다.</ArchiveDayMessage>}
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
        </>
      ) : null}

      <ArchiveClipPreviewDialog clip={previewClip} onClose={() => setPreviewClip(null)} />
    </section>
  );
}

function ArchiveDayMessage({ children }: { children: string }) {
  return (
    <p className="rounded-xl border border-dashed border-default px-4 py-12 text-center text-body-sm text-secondary">
      {children}
    </p>
  );
}
