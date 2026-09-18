"use client";

import { useState } from "react";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ArchiveClipSummary, ArchiveDetail } from "@/features/archives/archive";
import { archiveQueries } from "@/queries/archive-queries";

import { ArchiveClipCard } from "./archive-clip-card";
import {
  ArchiveClipPreviewDialog,
  type ArchiveClipPreviewItem,
} from "./archive-clip-preview-dialog";
import { ArchiveDetailHeader } from "./archive-detail-header";
import { useSystemArchiveDirectory } from "./use-system-archive-directory";

interface SystemCharacterArchiveContentProps {
  archive: ArchiveDetail;
}

export function SystemCharacterArchiveContent({ archive }: SystemCharacterArchiveContentProps) {
  const [previewClip, setPreviewClip] = useState<ArchiveClipSummary | null>(null);
  const { changeDay, changeSort, day, sort } = useSystemArchiveDirectory();
  const summaryQuery = useQuery(archiveQueries.systemClipSummary(archive.id));
  const clipsQuery = useInfiniteQuery(archiveQueries.systemClips(archive.id, { day, sort }));
  const clips = clipsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const neighborsQuery = useQuery(
    archiveQueries.systemClipNeighbors(archive.id, previewClip?.id ?? null, { day, sort }),
  );
  const nearbyItems: ArchiveClipPreviewItem[] = (neighborsQuery.data ?? []).map((clip) => ({
    clip,
    id: clip.id,
    note: null,
  }));
  const previewIndex = nearbyItems.findIndex((item) => item.clip.id === previewClip?.id);

  return (
    <>
      <ArchiveDetailHeader archive={archive} systemSummary={summaryQuery.data} />
      <section className="space-y-6 py-8 sm:py-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="봉누도 일차 필터">
            <Button
              aria-selected={day === null}
              onClick={() => changeDay(null)}
              size="sm"
              type="button"
              variant={day === null ? "default" : "outline"}
            >
              전체
            </Button>
            {summaryQuery.data?.seasonDays.map((seasonDay) => (
              <Button
                aria-selected={day === seasonDay.dayNumber}
                key={seasonDay.id}
                onClick={() => changeDay(seasonDay.dayNumber)}
                size="sm"
                type="button"
                variant={day === seasonDay.dayNumber ? "default" : "outline"}
              >
                {seasonDay.dayNumber}일차
              </Button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-body-sm text-secondary">
            정렬
            <select
              className="h-9 rounded-lg border border-default bg-background px-3 text-body-sm text-primary outline-none focus-visible:border-focus-ring"
              onChange={(event) => changeSort(event.target.value === "latest" ? "latest" : "oldest")}
              value={sort}
            >
              <option value="oldest">오래된순</option>
              <option value="latest">최신순</option>
            </select>
          </label>
        </div>

        {summaryQuery.isError ? (
          <MessageBox>시스템 아카이브 정보를 불러오지 못했습니다.</MessageBox>
        ) : null}
        {clipsQuery.isPending ? <LoadingBox /> : null}
        {clipsQuery.isError ? <MessageBox>시스템 아카이브 클립을 불러오지 못했습니다.</MessageBox> : null}
        {!clipsQuery.isPending && !clipsQuery.isError && clips.length === 0 ? (
          <MessageBox>선택한 조건에 등록된 클립이 없습니다.</MessageBox>
        ) : null}
        {clips.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {clips.map((clip) => (
              <ArchiveClipCard clip={clip} key={clip.id} onPreview={() => setPreviewClip(clip)} />
            ))}
          </div>
        ) : null}
        {clipsQuery.hasNextPage ? (
          <div className="flex justify-center">
            <Button
              disabled={clipsQuery.isFetchingNextPage}
              onClick={() => void clipsQuery.fetchNextPage()}
              type="button"
              variant="outline"
            >
              {clipsQuery.isFetchingNextPage ? "불러오는 중" : "클립 더 보기"}
            </Button>
          </div>
        ) : null}
      </section>
      <ArchiveClipPreviewDialog
        clip={previewClip}
        hasNext={previewIndex >= 0 && previewIndex < nearbyItems.length - 1}
        hasPrevious={previewIndex > 0}
        nearbyItems={nearbyItems}
        onClose={() => setPreviewClip(null)}
        onNext={() => {
          if (previewIndex >= 0 && previewIndex < nearbyItems.length - 1) {
            setPreviewClip(nearbyItems[previewIndex + 1].clip);
          }
        }}
        onPrevious={() => {
          if (previewIndex > 0) {
            setPreviewClip(nearbyItems[previewIndex - 1].clip);
          }
        }}
        onSelect={(item) => setPreviewClip(item.clip)}
      />
    </>
  );
}

function LoadingBox() {
  return (
    <div className="flex min-h-52 items-center justify-center gap-2 rounded-xl border border-default bg-surface-raised text-body-sm text-secondary">
      <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
      클립을 불러오는 중입니다.
    </div>
  );
}

function MessageBox({ children }: { children: string }) {
  return (
    <p className="rounded-xl border border-dashed border-default px-4 py-14 text-center text-body-sm text-tertiary">
      {children}
    </p>
  );
}
