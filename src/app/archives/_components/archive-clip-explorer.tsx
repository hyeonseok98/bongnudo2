"use client";

import { useDraggable } from "@dnd-kit/react";
import { Eye, Play, Plus, UserRound } from "lucide-react";

import { useCharacters } from "@/app/characters/_hooks/use-characters";
import { ClipFilters } from "@/app/clips/_components/clip-filters";
import { useClipDirectory } from "@/app/clips/_hooks/use-clip-directory";
import { useClipOptions, useClips } from "@/app/clips/_hooks/use-clips";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { ArchiveClipSummary } from "@/features/archives/archive";
import type { ClipItem } from "@/features/clips/clip";
import {
  getDisplayName,
  MEDIA_PREVIEW_BLUR_CLASS,
  shouldBlurMediaPreview,
} from "@/features/rp-mode/rp-mode";
import { useRpModeSettings } from "@/providers/rp-mode-provider";
import { cn } from "@/utils/cn";

import type { ArchiveWorkspaceDragData } from "./archive-workspace-dnd";

interface ArchiveClipExplorerProps {
  onAddClip: (clip: ArchiveClipSummary) => void;
  onPreviewClip: (clip: ArchiveClipSummary) => void;
  selectedClipIds: ReadonlySet<string>;
}

const clipDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  day: "numeric",
  month: "long",
  timeZone: "Asia/Seoul",
});

export function ArchiveClipExplorer({
  onAddClip,
  onPreviewClip,
  selectedClipIds,
}: ArchiveClipExplorerProps) {
  const directory = useClipDirectory();
  const charactersQuery = useCharacters();
  const optionsQuery = useClipOptions();
  const clipsQuery = useClips({ ...directory.filters, date: null });
  const characters = charactersQuery.data?.characters ?? [];
  const streamerAffiliations = charactersQuery.data?.streamerAffiliations ?? [];
  const clips = clipsQuery.data?.pages.flatMap((page) => page.items) ?? [];

  if (charactersQuery.isPending || optionsQuery.isPending) {
    return <ExplorerNotice>클립 탐색 정보를 불러오는 중입니다.</ExplorerNotice>;
  }

  if (charactersQuery.isError || optionsQuery.isError) {
    return <ExplorerNotice>클립 탐색 정보를 불러오지 못했습니다.</ExplorerNotice>;
  }

  return (
    <section aria-labelledby="archive-clip-explorer-heading" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-heading-sm font-semibold text-primary" id="archive-clip-explorer-heading">
            클립 탐색
          </h2>
          <p className="mt-1 text-body-sm text-secondary">
            버튼으로 추가하거나 원하는 클립을 현재 챕터로 드래그하세요.
          </p>
        </div>
        <Select
          label="클립 정렬"
          onValueChange={directory.changeSort}
          options={[
            { label: "최신순", value: "latest" },
            { label: "오래된순", value: "oldest" },
          ]}
          value={directory.sort}
        />
      </div>

      <ClipFilters
        characters={characters}
        date={null}
        dateRange={directory.dateFrom && directory.dateTo
          ? { from: directory.dateFrom, to: directory.dateTo }
          : null}
        day={directory.day}
        groups={directory.groupSelection}
        jobs={directory.jobSelection}
        options={optionsQuery.data}
        participantIds={directory.participantIds}
        tagIds={directory.tagIds}
        searchLabel="인물 검색"
        streamerAffiliations={streamerAffiliations}
        onDateChange={directory.changeDate}
        onDateRangeChange={(range) => directory.changeDateRange(
          range?.from ?? null,
          range?.to ?? null,
        )}
        onDayChange={directory.changeDay}
        onGroupsApply={directory.applyGroups}
        onJobsApply={directory.applyJobs}
        onParticipantsChange={directory.changeParticipants}
        onTagsChange={directory.changeTags}
        onReset={directory.resetFilters}
      />

      {clipsQuery.isPending ? (
        <ExplorerNotice>클립을 불러오는 중입니다.</ExplorerNotice>
      ) : clipsQuery.isError ? (
        <ExplorerNotice>클립을 불러오지 못했습니다.</ExplorerNotice>
      ) : clips.length === 0 ? (
        <ExplorerNotice>조건에 맞는 클립이 없습니다.</ExplorerNotice>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-3">
          {clips.map((clip) => (
            <ArchiveExplorerClipCard
              clip={clip}
              isAdded={selectedClipIds.has(clip.id)}
              key={clip.id}
              onAddClip={onAddClip}
              onPreviewClip={onPreviewClip}
            />
          ))}
        </div>
      )}

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
  );
}

function ArchiveExplorerClipCard({
  clip,
  isAdded,
  onAddClip,
  onPreviewClip,
}: {
  clip: ClipItem;
  isAdded: boolean;
  onAddClip: (clip: ArchiveClipSummary) => void;
  onPreviewClip: (clip: ArchiveClipSummary) => void;
}) {
  const { isMediaPreviewBlurEnabled, isRpMode } = useRpModeSettings();
  const displayName = clip.participant
    ? getDisplayName(clip.participant, "clip-card", isRpMode)
    : { primaryName: "인물 정보 없음", secondaryName: null };
  const shouldBlurThumbnail = shouldBlurMediaPreview(isRpMode, isMediaPreviewBlurEnabled);
  const archiveClip = toArchiveClipSummary(clip);
  const { handleRef, isDragging, ref } = useDraggable<ArchiveWorkspaceDragData>({
    data: { chapterId: null, clip: archiveClip, kind: "explorer-clip" },
    disabled: isAdded,
    id: `explorer:${clip.id}`,
  });

  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border border-default bg-surface-raised transition-opacity",
        isDragging && "opacity-50",
      )}
      ref={ref}
    >
      <button
        aria-label={`${clip.title} 미리보기`}
        className="group relative block w-full cursor-grab touch-none text-left focus-visible:outline-2 focus-visible:outline-focus-ring active:cursor-grabbing"
        onClick={() => onPreviewClip(archiveClip)}
        ref={handleRef}
        type="button"
      >
        <div className="relative aspect-video overflow-hidden bg-surface-muted">
          {clip.thumbnailUrl ? (
            <div
              aria-hidden="true"
              className={cn(
                "absolute inset-0 bg-cover bg-center transition-transform duration-default group-hover:scale-[1.02]",
                shouldBlurThumbnail && MEDIA_PREVIEW_BLUR_CLASS,
              )}
              style={{ backgroundImage: `url(${JSON.stringify(clip.thumbnailUrl)})` }}
            />
          ) : (
            <div className="grid size-full place-items-center text-tertiary">
              <Play aria-hidden="true" className="size-8" />
            </div>
          )}
          {clip.seasonDay ? (
            <Badge className="absolute top-2 left-2 bg-black/70 text-white">
              {clip.seasonDay.dayNumber}일차
            </Badge>
          ) : null}
        </div>
        <div className="space-y-3 p-3">
          <h3 className="line-clamp-2 text-body-sm font-semibold text-primary">{clip.title}</h3>
          <div className="flex min-w-0 items-center gap-2">
            {clip.participant?.profileImageUrl ? (
              <span
                aria-hidden="true"
                className="size-7 shrink-0 rounded-full bg-cover bg-center"
                style={{ backgroundImage: `url(${JSON.stringify(clip.participant.profileImageUrl)})` }}
              />
            ) : (
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-muted text-tertiary">
                <UserRound aria-hidden="true" className="size-4" />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-body-sm font-medium text-primary">{displayName.primaryName}</p>
              {displayName.secondaryName ? (
                <p className="truncate text-caption text-secondary">{displayName.secondaryName}</p>
              ) : null}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 text-caption text-tertiary">
            <span>{clipDateFormatter.format(new Date(clip.clipCreatedAt))}</span>
            <span className="inline-flex items-center gap-1">
              <Eye aria-hidden="true" className="size-3.5" />
              {clip.viewCount ?? "-"}
            </span>
          </div>
        </div>
      </button>
      <div className="px-3 pb-3">
        <Button
          className="w-full"
          disabled={isAdded}
          onClick={() => onAddClip(archiveClip)}
          size="sm"
          type="button"
          variant="outline"
        >
          <Plus aria-hidden="true" className="size-4" />
          {isAdded ? "추가됨" : "아카이브에 추가"}
        </Button>
      </div>
    </article>
  );
}

function ExplorerNotice({ children }: { children: string }) {
  return (
    <p className="rounded-xl border border-default bg-surface-muted px-4 py-8 text-center text-body-sm text-secondary">
      {children}
    </p>
  );
}

function toArchiveClipSummary(clip: ClipItem): ArchiveClipSummary {
  return {
    clipCreatedAt: clip.clipCreatedAt,
    clipUrl: clip.clipUrl,
    id: clip.id,
    participant: clip.participant,
    seasonDay: clip.seasonDay,
    thumbnailUrl: clip.thumbnailUrl,
    title: clip.title,
  };
}
