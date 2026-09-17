"use client";

import { List, UsersRound } from "lucide-react";

import { useQueryClient } from "@tanstack/react-query";

import { useCharacters } from "@/app/characters/_hooks/use-characters";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { ClipItem } from "@/features/clips/clip";
import { clipQueries } from "@/queries/clip-queries";
import { cn } from "@/utils/cn";

import { useClipDirectory } from "../_hooks/use-clip-directory";
import { useClipOptions, useClips } from "../_hooks/use-clips";
import { ClipCardGrid } from "./clip-card";
import { ClipFilters } from "./clip-filters";

interface ClipsContentProps {
  canManageCollectedMedia: boolean;
}

export function ClipsContent({ canManageCollectedMedia }: ClipsContentProps) {
  const queryClient = useQueryClient();
  const directory = useClipDirectory();
  const charactersQuery = useCharacters();
  const optionsQuery = useClipOptions();
  const clipsQuery = useClips(directory.filters);
  const characters = charactersQuery.data?.characters ?? [];
  const streamerAffiliations = charactersQuery.data?.streamerAffiliations ?? [];
  const clips = clipsQuery.data?.pages.flatMap((page) => page.items) ?? [];

  if (charactersQuery.isPending || optionsQuery.isPending) {
    return <ClipsLoadingState />;
  }

  if (charactersQuery.isError || optionsQuery.isError) {
    return <ClipsErrorState />;
  }

  return (
    <div className="space-y-6">
      <ClipsHeading />
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

      {clipsQuery.isPending ? (
        <p className="text-body-sm text-secondary" role="status">
          클립을 불러오는 중입니다.
        </p>
      ) : clipsQuery.isError ? (
        <p className="text-body-sm text-status-danger" role="alert">
          클립을 불러오지 못함.
        </p>
      ) : (
        <section aria-labelledby="clip-results-heading" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-body-sm text-secondary" id="clip-results-heading">
                현재 불러온 클립 <strong className="font-semibold text-brand-text">{clips.length}개</strong>
              </h2>
              {clipsQuery.isFetching && !clipsQuery.isFetchingNextPage ? (
                <p className="mt-1 text-caption text-tertiary" role="status">필터 결과를 업데이트하는 중입니다.</p>
              ) : null}
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <ClipViewToggle
                view={directory.view}
                onViewChange={directory.changeView}
              />
              <>
                <span className="text-body-sm text-secondary">정렬</span>
                <Select
                  label="클립 정렬"
                  onValueChange={directory.changeSort}
                  options={[
                    { label: "최신순", value: "latest" },
                    { label: "오래된순", value: "oldest" },
                  ]}
                  value={directory.sort}
                />
              </>
            </div>
          </div>

          {clips.length > 0 ? (
            directory.view === "people" ? (
              <ClipPeopleView
                canManageCollectedMedia={canManageCollectedMedia}
                clips={clips}
                onExcluded={() => void queryClient.invalidateQueries({ queryKey: clipQueries.all() })}
              />
            ) : (
              <ClipCardGrid
                canManageCollectedMedia={canManageCollectedMedia}
                clips={clips}
                onExcluded={() => void queryClient.invalidateQueries({ queryKey: clipQueries.all() })}
              />
            )
          ) : (
            <ClipEmptyState />
          )}

          {clipsQuery.hasNextPage ? (
            <div className="flex justify-center pt-2">
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
      )}
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

function ClipsLoadingState() {
  return (
    <div className="space-y-6">
      <ClipsHeading />
      <p className="text-body-sm text-secondary" role="status">
        클립 탐색 정보를 불러오는 중입니다.
      </p>
    </div>
  );
}

function ClipsErrorState() {
  return (
    <div className="space-y-6">
      <ClipsHeading />
      <p className="text-body-sm text-status-danger" role="alert">
        클립 탐색 정보를 불러오지 못함.
      </p>
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

function ClipViewToggle({
  view,
  onViewChange,
}: {
  view: "timeline" | "people";
  onViewChange: (view: "timeline" | "people") => void;
}) {
  return (
    <div aria-label="클립 보기 방식" className="flex rounded-lg border border-default bg-background p-1">
      <button
        aria-pressed={view === "timeline"}
        className={cn(
          "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-body-sm font-medium text-secondary",
          view === "timeline" && "bg-surface-muted text-primary",
        )}
        onClick={() => onViewChange("timeline")}
        type="button"
      >
        <List aria-hidden="true" className="size-4" />
        전체
      </button>
      <button
        aria-pressed={view === "people"}
        className={cn(
          "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-body-sm font-medium text-secondary",
          view === "people" && "bg-surface-muted text-primary",
        )}
        onClick={() => onViewChange("people")}
        type="button"
      >
        <UsersRound aria-hidden="true" className="size-4" />
        인물별
      </button>
    </div>
  );
}

interface ClipPeopleViewProps {
  canManageCollectedMedia: boolean;
  clips: ClipItem[];
  onExcluded: () => void;
}

function ClipPeopleView({
  canManageCollectedMedia,
  clips,
  onExcluded,
}: ClipPeopleViewProps) {
  const clipsByParticipant = new Map<string, { clips: ClipItem[]; label: string }>();

  for (const clip of clips) {
    const participantId = clip.participant?.id ?? `unknown:${clip.id}`;
    const entry = clipsByParticipant.get(participantId);

    if (entry) {
      entry.clips.push(clip);
      continue;
    }

    clipsByParticipant.set(participantId, {
      clips: [clip],
      label: clip.participant?.rpName ?? clip.participant?.streamerName ?? "인물 정보 없음",
    });
  }

  return (
    <div className="space-y-8">
      {Array.from(clipsByParticipant.entries()).map(([participantId, group]) => (
        <section aria-labelledby={`clip-person-${participantId}`} className="space-y-3" key={participantId}>
          <h3 className="text-heading-sm font-semibold text-primary" id={`clip-person-${participantId}`}>
            {group.label}
            <span className="ml-2 text-body-sm font-medium text-secondary">
              {group.clips.length}개
            </span>
          </h3>
          <ClipCardGrid
            canManageCollectedMedia={canManageCollectedMedia}
            clips={group.clips}
            onExcluded={onExcluded}
          />
        </section>
      ))}
    </div>
  );
}
