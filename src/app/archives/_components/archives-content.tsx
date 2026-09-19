"use client";

import Link from "next/link";

import { parseAsStringLiteral, useQueryState } from "nuqs";

import { Archive, CalendarDays, LoaderCircle, LogIn, Plus, UsersRound } from "lucide-react";

import { useCharacters } from "@/app/characters/_hooks/use-characters";
import { Button, buttonVariants } from "@/components/ui/button";
import { ArchiveGridSkeleton } from "@/components/archive-grid-skeleton";
import { FilterBarSkeleton } from "@/components/media-grid-skeleton";
import { RetryButton } from "@/components/ui/retry-button";
import { cn } from "@/utils/cn";

import { useArchiveDirectory } from "../_hooks/use-archive-directory";
import { useArchives } from "../_hooks/use-archives";
import { ArchiveCard } from "./archive-card";
import { ArchiveDayView } from "./archive-day-view";
import { ArchiveFilters } from "./archive-filters";
import { ArchivePeopleView } from "./archive-people-view";

interface ArchivesContentProps {
  isSignedIn: boolean;
}

type ArchiveExploreView = "all" | "day" | "people";

const archiveExploreViewParser = parseAsStringLiteral(["all", "day", "people"] as const)
  .withDefault("all");

export function ArchivesContent({ isSignedIn }: ArchivesContentProps) {
  const [view, setView] = useQueryState("view", archiveExploreViewParser);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-title font-bold text-primary">아카이브</h1>
          <p className="mt-1 text-body text-secondary">
            봉누도2의 이야기를 만든 기록과 인물별 클립을 찾아보세요.
          </p>
        </div>
        <ArchiveCreateCta isSignedIn={isSignedIn} />
      </header>

      <div className="space-y-4">
        <ArchiveScopeTabs isSignedIn={isSignedIn} />
        <ArchiveViewTabs onViewChange={(nextView) => void setView(nextView, { history: "replace" })} view={view} />
      </div>

      {view === "all" ? <ArchivePublicList /> : null}
      {view === "day" ? <ArchiveDayView /> : null}
      {view === "people" ? <ArchivePeopleView /> : null}
    </div>
  );
}

function ArchiveScopeTabs({ isSignedIn }: { isSignedIn: boolean }) {
  if (!isSignedIn) {
    return null;
  }

  return (
    <div aria-label="아카이브 범위" className="flex flex-wrap gap-2 border-b border-default pb-3" role="tablist">
      <Button aria-selected size="sm" type="button">
        전체 공개
      </Button>
      <Link className={buttonVariants({ size: "sm", variant: "outline" })} href="/my/archives">
        내 아카이브
      </Link>
    </div>
  );
}

function ArchiveViewTabs({
  onViewChange,
  view,
}: {
  onViewChange: (view: ArchiveExploreView) => void;
  view: ArchiveExploreView;
}) {
  const tabs: Array<{ icon: typeof Archive; label: string; value: ArchiveExploreView }> = [
    { icon: Archive, label: "전체", value: "all" },
    { icon: CalendarDays, label: "일자별", value: "day" },
    { icon: UsersRound, label: "인물별", value: "people" },
  ];

  return (
    <div aria-label="공개 아카이브 보기 방식" className="flex w-fit rounded-lg border border-default bg-background p-1" role="tablist">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isSelected = view === tab.value;

        return (
          <button
            aria-selected={isSelected}
            className={cn(
              "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-body-sm font-medium text-secondary",
              isSelected && "bg-surface-muted text-primary",
            )}
            key={tab.value}
            onClick={() => onViewChange(tab.value)}
            role="tab"
            type="button"
          >
            <Icon aria-hidden="true" className="size-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function ArchivePublicList() {
  const directory = useArchiveDirectory();
  const charactersQuery = useCharacters();
  const archivesQuery = useArchives(directory.filters);
  const archives = archivesQuery.data?.pages.flatMap((page) => page.items) ?? [];

  if (charactersQuery.isError) {
    return <ArchiveErrorState isRetrying={charactersQuery.isFetching} onRetry={() => void charactersQuery.refetch()} />;
  }

  return (
    <div className="space-y-5">
      {charactersQuery.isPending ? <FilterBarSkeleton /> : null}
      {charactersQuery.data ? (
        <ArchiveFilters
          category={directory.category}
          characters={charactersQuery.data.characters}
          participantId={directory.participantId}
          searchInput={directory.searchInput}
          status={directory.status}
          onCategoryChange={directory.changeCategory}
          onParticipantChange={directory.changeParticipant}
          onReset={directory.resetFilters}
          onSearchInputChange={directory.changeSearchInput}
          onStatusChange={directory.changeStatus}
        />
      ) : null}

      {charactersQuery.data && archivesQuery.isPending ? <ArchiveGridSkeleton /> : null}
      {archivesQuery.isError ? <ArchiveErrorState onRetry={() => void archivesQuery.refetch()} /> : null}
      {charactersQuery.data && !archivesQuery.isPending && !archivesQuery.isError ? (
        <section aria-labelledby="archive-results-heading" className="space-y-4">
          <div className="flex min-h-5 items-center justify-between gap-3">
            <h2 className="text-heading-sm font-semibold text-primary" id="archive-results-heading">공개 아카이브</h2>
            <span
              aria-label="아카이브 결과를 업데이트하는 중입니다."
              className={cn(
                "inline-flex size-4 items-center justify-center text-tertiary",
                !(archivesQuery.isFetching && !archivesQuery.isFetchingNextPage) && "invisible",
              )}
              role="status"
            >
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              <span className="sr-only">아카이브 결과를 업데이트하는 중입니다.</span>
            </span>
          </div>

          {archives.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {archives.map((archive) => <ArchiveCard archive={archive} key={archive.id} />)}
            </div>
          ) : (
            <ArchiveEmptyState
              hasFilters={
                directory.participantId !== null ||
                directory.category !== null ||
                directory.status !== null
              }
              hasSearch={directory.query.length > 0}
            />
          )}

          {archivesQuery.hasNextPage ? (
            <div className="flex justify-center pt-2">
              <Button
                disabled={archivesQuery.isFetchingNextPage}
                onClick={() => void archivesQuery.fetchNextPage()}
                type="button"
                variant="outline"
              >
                {archivesQuery.isFetchingNextPage ? "아카이브를 더 불러오는 중입니다." : "아카이브 더 보기"}
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function ArchiveCreateCta({ isSignedIn }: { isSignedIn: boolean }) {
  const href = isSignedIn ? "/archives/new" : "/login?returnTo=%2Farchives%2Fnew";

  return (
    <Link className={cn(buttonVariants(), "self-start sm:self-auto")} href={href}>
      {isSignedIn ? <Plus aria-hidden="true" /> : <LogIn aria-hidden="true" />}
      아카이브 만들기
    </Link>
  );
}

function ArchiveErrorState({
  isRetrying = false,
  onRetry,
}: {
  isRetrying?: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-default px-4 py-10 text-center" role="alert">
      <p className="text-body-sm text-status-danger">공개 아카이브를 불러오지 못했습니다.</p>
      <RetryButton isPending={isRetrying} onRetry={onRetry} />
    </div>
  );
}

function ArchiveEmptyState({ hasFilters, hasSearch }: { hasFilters: boolean; hasSearch: boolean }) {
  const message = hasSearch
    ? "검색 결과가 없습니다."
    : hasFilters
      ? "조건에 맞는 아카이브가 없습니다."
      : "아직 공개된 아카이브가 없습니다.";

  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-default px-5 py-10 text-center">
      <Archive aria-hidden="true" className="size-8 text-tertiary" />
      <p className="mt-3 text-heading-sm font-semibold text-primary">{message}</p>
    </div>
  );
}
