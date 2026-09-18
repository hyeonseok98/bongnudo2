"use client";

import { useQuery } from "@tanstack/react-query";

import { archiveQueries } from "@/queries/archive-queries";
import { RetryButton } from "@/components/ui/retry-button";

import { ArchiveDetailHeader } from "./archive-detail-header";
import { ArchiveUserContent } from "./archive-user-content";
import { SystemCharacterArchiveContent } from "./system-character-archive-content";

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
      <div className="h-8 w-28 animate-pulse rounded bg-surface-muted" />
      <div className="h-12 max-w-xl animate-pulse rounded bg-surface-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="aspect-[4/3] animate-pulse rounded-xl bg-surface-muted" key={index} />
        ))}
      </div>
    </div>
  );
}
