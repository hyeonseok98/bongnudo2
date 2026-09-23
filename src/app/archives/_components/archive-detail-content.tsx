"use client";

import { useQuery } from "@tanstack/react-query";

import { archiveQueries } from "@/queries/archive-queries";
import { RetryButton } from "@/components/ui/retry-button";
import { Skeleton } from "@/components/ui/skeleton";

import { ArchiveDetailHeader } from "./archive-detail-header";
import { ArchiveUserContent } from "./archive-user-content";
import { SystemCharacterArchiveContent } from "./system-character-archive-content";
import { ArchiveClipCardSkeleton } from "./archive-clip-card";

interface ArchiveDetailContentProps {
  archiveId: string;
}

export function ArchiveDetailContent({ archiveId }: ArchiveDetailContentProps) {
  const archiveQuery = useQuery(archiveQueries.detail(archiveId));

  if (archiveQuery.isPending) {
    return <ArchiveDetailLoading />;
  }

  if (archiveQuery.isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-body-sm text-secondary">아카이브를 찾을 수 없거나 접근할 수 없습니다.</p>
        <RetryButton isPending={archiveQuery.isFetching} onRetry={() => void archiveQuery.refetch()} />
      </div>
    );
  }

  return archiveQuery.data.archiveKind === "system_character" ? (
    <SystemCharacterArchiveContent archive={archiveQuery.data} />
  ) : (
    <>
      <ArchiveDetailHeader archive={archiveQuery.data} />
      <ArchiveUserContent archive={archiveQuery.data} />
    </>
  );
}

function ArchiveDetailLoading() {
  return (
    <div className="space-y-8 py-8 sm:py-10" aria-label="아카이브를 불러오는 중입니다.">
      <header className="space-y-4 border-b border-default pb-8">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-10 w-2/3 max-w-xl" />
        <Skeleton className="h-4 w-full max-w-3xl" />
        <Skeleton className="h-4 w-4/5 max-w-2xl" />
        <div className="flex gap-5"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-28" /><Skeleton className="h-4 w-32" /></div>
      </header>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton className="h-9 w-20" key={index} />
            ))}
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <ArchiveClipCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
