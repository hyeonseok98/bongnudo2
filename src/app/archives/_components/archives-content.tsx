"use client";

import { parseAsStringLiteral, useQueryState } from "nuqs";
import Link from "next/link";
import { Archive, BookOpen, LoaderCircle, Sparkles, Tags, UsersRound } from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { ArchiveParticipantSearchResult } from "@/apis/archives/get-archives";
import { archiveQueries } from "@/queries/archive-queries";
import { Button } from "@/components/ui/button";
import { ArchiveGridSkeleton } from "@/components/archive-grid-skeleton";

import { RetryButton } from "@/components/ui/retry-button";
import { cn } from "@/utils/cn";

import { useArchiveDirectory } from "../_hooks/use-archive-directory";
import { useArchives } from "../_hooks/use-archives";
import { ArchiveCard } from "./archive-card";
import { ArchiveHero, type ArchiveExploreView } from "./archive-hero";
import { ArchiveHomeV2 } from "./archive-home-v2";
import { ArchiveDayView } from "./archive-day-view";
import { ArchiveFilters } from "./archive-filters";
import { ArchivePeopleView } from "./archive-people-view";

interface ArchivesContentProps {
  isSignedIn: boolean;
}

const archiveExploreViewParser = parseAsStringLiteral(["all", "day", "people", "topics"] as const)
  .withDefault("all");

export function ArchivesContent({ isSignedIn }: ArchivesContentProps) {
  const [view, setView] = useQueryState("view", archiveExploreViewParser);
  const directory = useArchiveDirectory();
  const [selectedParticipant, setSelectedParticipant] = useState<ArchiveParticipantSearchResult | null>(null);
  const participantQuery = useQuery({
    ...archiveQueries.person(directory.participantId),
    enabled: view === "all" && directory.participantId !== null && selectedParticipant?.seasonParticipantId !== directory.participantId,
  });
  const participant = selectedParticipant?.seasonParticipantId === directory.participantId
    ? selectedParticipant : participantQuery.data?.participant;
  const participantLabel = participant?.rpName ?? participant?.streamerName ?? "선택한 인물";

  const heroProps = {
    isSignedIn,
    onParticipantSelect: (person: ArchiveParticipantSearchResult) => {
      void setView("all", { history: "replace" });
      setSelectedParticipant(person);
      directory.changeParticipant(person.seasonParticipantId);
    },
    onSearchChange: (query: string) => {
      void setView("all", { history: "replace" });
      directory.changeSearchInput(query);
    },
    onViewChange: (nextView: ArchiveExploreView) => {
      void setView(nextView, { history: "replace" });
    },
    searchValue: view === "all" ? directory.searchInput : "",
    view,
  };

  return (
    <div className="space-y-8">
      {view === "all" && !directory.hasFilters ? <ArchiveHomeV2 {...heroProps} /> : <ArchiveHero {...heroProps} />}
      {view === "all" && directory.hasFilters ? (
        <ArchiveSearchResults directory={directory} participantLabel={participantLabel} />
      ) : null}
      {view === "day" ? <ArchiveDayView /> : null}
      {view === "people" ? <ArchivePeopleView /> : null}
      {view === "topics" ? <ArchiveTopicsView /> : null}
    </div>
  );
}

const topicDetails = {
  character: { icon: UsersRound, label: "인물" },
  incident: { icon: Sparkles, label: "사건" },
  series: { icon: BookOpen, label: "시리즈" },
  other: { icon: Tags, label: "기타" },
} as const;

function ArchiveTopicsView() {
  const query = useQuery(archiveQueries.home());
  const directory = useArchiveDirectory();
  const archivesQuery = useArchives(directory.filters, directory.category !== null);
  const archives = archivesQuery.data?.pages.flatMap((page) => page.items) ?? [];

  if (query.isPending) {
    return <ArchiveGridSkeleton />;
  }

  if (query.isError) {
    return <ArchiveErrorState isRetrying={query.isFetching} onRetry={() => void query.refetch()} />;
  }

  const topics = query.data.categories.filter((topic) => topic.archiveCount > 0);

  return (
    <section aria-labelledby="archive-topics-heading" className="space-y-5" id="archive-topics">
      <header>
        <h1 id="archive-topics-heading" className="text-heading-lg font-semibold text-primary">주제별 아카이브</h1>
        <p className="mt-1 text-body text-secondary">등록된 주제에서 관련된 공개 아카이브를 찾아보세요.</p>
      </header>
      {topics.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {topics.map(({ archiveCount, category }) => {
            const detail = topicDetails[category];
            const Icon = detail.icon;
            return (
              <Link
                className="group flex h-24 w-40 flex-col rounded-lg bg-surface-raised/45 p-3 transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-focus-ring"
                href={`/archives?view=topics&category=${category}`}
                key={category}
              >
                <Icon aria-hidden="true" className="size-5 text-brand-text" />
                <span className="mt-auto flex items-center justify-between gap-2">
                  <span className="text-body-sm font-semibold text-primary group-hover:text-brand-text">{detail.label}</span>
                  <span className="text-caption text-secondary">{archiveCount}개</span>
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <ArchiveEmptyState hasFilters={false} hasSearch={false} />
      )}
      {directory.category ? (
        <section aria-labelledby="archive-topic-results-heading" className="space-y-4 pt-2">
          <div>
            <h2 className="text-heading-sm font-semibold text-primary" id="archive-topic-results-heading">
              {topicDetails[directory.category].label} 아카이브
            </h2>
            <p className="mt-1 text-body-sm text-secondary">선택한 주제의 공개 아카이브입니다.</p>
          </div>
          {archivesQuery.isPending ? <ArchiveGridSkeleton count={6} /> : null}
          {archivesQuery.isError ? <ArchiveErrorState isRetrying={archivesQuery.isFetching} onRetry={() => void archivesQuery.refetch()} /> : null}
          {!archivesQuery.isPending && !archivesQuery.isError && archives.length === 0 ? (
            <ArchiveEmptyState hasFilters hasSearch={false} />
          ) : null}
          {archives.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
              {archives.map((archive) => <ArchiveCard archive={archive} key={archive.id} />)}
            </div>
          ) : null}
        </section>
      ) : null}
    </section>
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
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
