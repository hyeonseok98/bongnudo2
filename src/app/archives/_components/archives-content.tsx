"use client";

import Link from "next/link";

import { parseAsStringLiteral, useQueryState } from "nuqs";

import { Archive, CalendarDays, LoaderCircle, LogIn, Plus, UsersRound } from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { ArchiveParticipantSearchResult } from "@/apis/archives/get-archives";
import { archiveQueries } from "@/queries/archive-queries";
import { Button, buttonVariants } from "@/components/ui/button";
import { ArchiveGridSkeleton } from "@/components/archive-grid-skeleton";

import { RetryButton } from "@/components/ui/retry-button";
import { cn } from "@/utils/cn";

import { useArchiveDirectory } from "../_hooks/use-archive-directory";
import { useArchives } from "../_hooks/use-archives";
import { ArchiveCard } from "./archive-card";
import { ArchiveDiscoveryHome } from "./archive-discovery-home";
import { ArchiveSearch } from "./archive-search";
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
            봉누도2에서 만들어진 기록과 이야기를 찾아보세요.
          </p>
        </div>
        <ArchiveHeaderActions isSignedIn={isSignedIn} />
      </header>

      <ArchiveViewTabs onViewChange={(nextView) => void setView(nextView, { history: "replace" })} view={view} />

      <ArchiveExploreContent view={view} onSearchStart={() => void setView("all", { history: "replace" })} />
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

function ArchiveExploreContent({ view, onSearchStart }: { view: ArchiveExploreView; onSearchStart: () => void }) {
  const directory = useArchiveDirectory();
  const [selectedParticipant, setSelectedParticipant] = useState<ArchiveParticipantSearchResult | null>(null);
  const participantQuery = useQuery({
    ...archiveQueries.person(directory.participantId),
    enabled: view === "all" && directory.participantId !== null && selectedParticipant?.seasonParticipantId !== directory.participantId,
  });
  const participant = selectedParticipant?.seasonParticipantId === directory.participantId
    ? selectedParticipant : participantQuery.data?.participant;
  const participantLabel = participant?.rpName ?? participant?.streamerName ?? "선택한 인물";

  return (
    <div className="space-y-8">
      <ArchiveSearch value={view === "all" ? directory.searchInput : ""} onChange={(query) => {
        onSearchStart();
        directory.changeSearchInput(query);
      }} onParticipantSelect={(person) => {
        onSearchStart();
        setSelectedParticipant(person);
        directory.changeParticipant(person.seasonParticipantId);
      }} />
      {view === "all" && directory.hasFilters ? (
        <ArchiveSearchResults directory={directory} participantLabel={participantLabel} />
      ) : view === "all" ? <ArchiveDiscoveryHome /> : null}
      {view === "day" ? <ArchiveDayView /> : null}
      {view === "people" ? <ArchivePeopleView /> : null}
    </div>
  );
}

function ArchiveSearchResults({ directory, participantLabel }: {
  directory: ReturnType<typeof useArchiveDirectory>;
  participantLabel: string;
}) {
  const archivesQuery = useArchives(directory.filters, directory.participantId !== null || directory.searchInput.trim() === directory.query);
  const archives = archivesQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const title = directory.participantId ? `${participantLabel} 관련 아카이브`
    : directory.searchInput.trim() ? `‘${directory.searchInput.trim()}’ 검색 결과`
    : directory.sort === "recommended" ? "많이 추천받은 아카이브"
    : directory.sort === "published" ? "최근 공개 아카이브" : "공개 아카이브";

  return (
    <section aria-labelledby="archive-results-heading" className="space-y-5">
      <ArchiveFilters directory={directory} participantLabel={participantLabel} />
      <div className="flex min-h-6 items-center justify-between gap-3">
        <h2 id="archive-results-heading" className="text-heading-sm font-semibold text-primary">{title}</h2>
        <div className="flex items-center gap-3">
          <LoaderCircle aria-label="검색 결과를 업데이트하는 중입니다." className={cn("size-4 animate-spin text-secondary", !archivesQuery.isFetching && "invisible")} />
          <button className="cursor-pointer text-body-sm text-secondary hover:text-primary" onClick={directory.resetFilters} type="button">탐색 홈으로</button>
        </div>
      </div>
      {archivesQuery.isPending ? <ArchiveGridSkeleton /> : null}
      {archivesQuery.isError ? <ArchiveErrorState isRetrying={archivesQuery.isFetching} onRetry={() => void archivesQuery.refetch()} /> : null}
      {archives.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {archives.map((archive) => <ArchiveCard archive={archive} key={archive.id} />)}
        </div>
      ) : archivesQuery.isSuccess ? <ArchiveEmptyState hasFilters={directory.hasFilters} hasSearch={directory.query.length > 0} /> : null}
      {archivesQuery.hasNextPage ? (
        <div className="flex justify-center pt-2">
          <Button disabled={archivesQuery.isFetching || archivesQuery.isPlaceholderData} onClick={() => void archivesQuery.fetchNextPage()} type="button" variant="outline">
            {archivesQuery.isFetchingNextPage ? "아카이브를 더 불러오는 중입니다." : "아카이브 더 보기"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function ArchiveHeaderActions({ isSignedIn }: { isSignedIn: boolean }) {
  const href = isSignedIn ? "/archives/new" : "/login?returnTo=%2Farchives%2Fnew";

  return (
    <div className="flex flex-wrap gap-2 self-start sm:self-auto">
      {isSignedIn ? (
        <Link className={buttonVariants({ variant: "outline" })} href="/my/archives">
          내 아카이브
        </Link>
      ) : null}
      <Link className={buttonVariants()} href={href}>
        {isSignedIn ? <Plus aria-hidden="true" /> : <LogIn aria-hidden="true" />}
        아카이브 만들기
      </Link>
    </div>
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
