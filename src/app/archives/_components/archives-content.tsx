"use client";

import Link from "next/link";

import { Archive, LogIn, Plus } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/utils/cn";

import { useArchiveDirectory } from "../_hooks/use-archive-directory";
import { useArchives } from "../_hooks/use-archives";
import { ArchiveCard } from "./archive-card";
import { ArchiveFilters } from "./archive-filters";

interface ArchivesContentProps {
  isSignedIn: boolean;
}

export function ArchivesContent({ isSignedIn }: ArchivesContentProps) {
  const directory = useArchiveDirectory();
  const archivesQuery = useArchives(directory.filters);
  const archives = archivesQuery.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-title font-bold text-primary">아카이브</h1>
          <p className="mt-1 text-body text-secondary">
            봉누도2의 이야기를 만든 기록과 인물별 클립을 찾아보세요.
          </p>
        </div>
        <ArchiveCreateCta isSignedIn={isSignedIn} />
      </header>

      <ArchiveFilters
        category={directory.category}
        participantId={directory.participantId}
        searchInput={directory.searchInput}
        sort={directory.sort}
        status={directory.status}
        type={directory.type}
        onCategoryChange={directory.changeCategory}
        onParticipantChange={directory.changeParticipant}
        onReset={directory.resetFilters}
        onSearchInputChange={directory.changeSearchInput}
        onSortChange={directory.changeSort}
        onStatusChange={directory.changeStatus}
        onTypeChange={directory.changeType}
      />

      {archivesQuery.isPending ? <ArchiveLoadingState /> : null}
      {archivesQuery.isError ? <ArchiveErrorState /> : null}
      {!archivesQuery.isPending && !archivesQuery.isError ? (
        <section aria-labelledby="archive-results-heading" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-body-sm text-secondary" id="archive-results-heading">
              현재 불러온 아카이브 <strong className="font-semibold text-brand-text">{archives.length}개</strong>
            </h2>
          </div>

          {archives.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {archives.map((archive) => <ArchiveCard archive={archive} key={archive.id} />)}
            </div>
          ) : (
            <ArchiveEmptyState
              hasFilters={
                directory.type !== "all" ||
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

function ArchiveLoadingState() {
  return (
    <div aria-label="아카이브를 불러오는 중입니다." className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }, (_, index) => (
        <div className="aspect-[4/3] animate-pulse rounded-xl bg-surface-muted" key={index} />
      ))}
    </div>
  );
}

function ArchiveErrorState() {
  return (
    <p className="rounded-xl border border-dashed border-default px-4 py-14 text-center text-body-sm text-status-danger" role="alert">
      공개 아카이브를 불러오지 못했습니다.
    </p>
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
