"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useQuery } from "@tanstack/react-query";
import { parseAsInteger, useQueryState } from "nuqs";
import { ArrowRight } from "lucide-react";

import { ArchiveGridSkeleton } from "@/components/archive-grid-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RetryButton } from "@/components/ui/retry-button";
import type { ArchiveListItem } from "@/features/archives/archive";
import { getLatestCompletedSeasonDayByDateTime } from "@/features/seasons/season-day";
import { archiveQueries } from "@/queries/archive-queries";

import { ArchiveCard } from "./archive-card";

export function ArchiveDayView() {
  const [selectedDay, setSelectedDay] = useQueryState("day", parseAsInteger);
  const optionsQuery = useQuery(archiveQueries.editorOptions());
  const day = selectedDay ?? getLatestCompletedSeasonDayByDateTime(
    optionsQuery.data?.seasonDays ?? [],
    new Date(),
  )?.dayNumber ?? null;
  const seasonDayId = optionsQuery.data?.seasonDays.find(
    (seasonDay) => seasonDay.dayNumber === day,
  )?.id ?? null;
  const relatedArchivesQuery = useQuery(archiveQueries.dayRelatedArchives(seasonDayId));

  if (optionsQuery.isPending) {
    return <ArchiveDaySkeleton />;
  }

  if (optionsQuery.isError || !optionsQuery.data) {
    return <ArchiveDayMessage>봉누도 일차를 불러오지 못했습니다.<RetryButton isPending={optionsQuery.isFetching} onRetry={() => void optionsQuery.refetch()} /></ArchiveDayMessage>;
  }

  return (
    <section aria-labelledby="archive-day-heading" className="space-y-7">
      <div>
        <h2 className="text-heading font-semibold text-primary" id="archive-day-heading">일자별 탐색</h2>
        <p className="mt-2 text-body text-secondary">봉누도 운영 일차에 연결된 아카이브를 살펴보세요.</p>
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

      {day !== null ? (
        <Link
          className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-body-sm font-medium text-secondary hover:text-primary focus-visible:outline-2 focus-visible:outline-focus-ring"
          href={`/clips?day=${day}`}
        >
          {day}일차 클립 보기
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      ) : null}

      <RelatedArchives
        archives={relatedArchivesQuery.data ?? []}
        isError={relatedArchivesQuery.isError}
        isPending={relatedArchivesQuery.isPending}
        onRetry={() => void relatedArchivesQuery.refetch()}
      />
    </section>
  );
}

function ArchiveDaySkeleton() {
  return (
    <section aria-label="일자별 아카이브를 불러오는 중입니다." className="space-y-7" role="status">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-6 w-80 max-w-full" />
      </div>
      <div className="flex gap-2 overflow-hidden pb-1">
        {Array.from({ length: 6 }, (_, index) => <Skeleton className="h-9 w-20 shrink-0" key={index} />)}
      </div>
      <Skeleton className="h-9 w-40" />
      <section className="space-y-4 border-t border-default pt-7">
        <div className="space-y-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-6 w-80 max-w-full" />
        </div>
        <ArchiveGridSkeleton count={3} />
      </section>
    </section>
  );
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
        <ArchiveDayMessage>이 일차에 연결된 아카이브가 없습니다.</ArchiveDayMessage>
      ) : null}
      {archives.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
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
