"use client";

import { useQuery } from "@tanstack/react-query";
import { Archive, UserRound } from "lucide-react";

import { ArchiveGridSkeleton } from "@/components/archive-grid-skeleton";
import { RetryButton } from "@/components/ui/retry-button";
import type { ArchivePeopleSection } from "@/features/archives/archive";
import { getDisplayName } from "@/features/rp-mode/rp-mode";
import { useRpModeSettings } from "@/providers/rp-mode-provider";
import { archiveQueries } from "@/queries/archive-queries";

import { ArchiveCard } from "./archive-card";

export function ArchivePeopleView() {
  const peopleQuery = useQuery(archiveQueries.people());

  return (
    <section aria-labelledby="archive-people-heading" className="space-y-7">
      <div>
        <h2 className="text-heading font-semibold text-primary" id="archive-people-heading">인물별 탐색</h2>
        <p className="mt-2 text-body text-secondary">인물과 함께 남은 공개 아카이브를 살펴보세요.</p>
      </div>

      {peopleQuery.isPending ? <ArchivePeopleLoadingState /> : null}
      {peopleQuery.isError ? (
        <ArchivePeopleError
          isRetrying={peopleQuery.isFetching}
          onRetry={() => void peopleQuery.refetch()}
        />
      ) : null}
      {peopleQuery.data && peopleQuery.data.length > 0 ? (
        <div className="space-y-10">
          {peopleQuery.data.map((section) => (
            <ArchivePersonSection
              archives={section.archives}
              key={section.participant.id}
              participant={section.participant}
            />
          ))}
        </div>
      ) : null}
      {peopleQuery.data && peopleQuery.data.length === 0 ? (
        <ArchivePeopleMessage>인물과 연결된 공개 아카이브가 없습니다.</ArchivePeopleMessage>
      ) : null}
    </section>
  );
}

function ArchivePeopleLoadingState() {
  return (
    <div className="space-y-10" role="status">
      {Array.from({ length: 3 }, (_, index) => (
        <section className="space-y-4" key={index}>
          <div className="h-6 w-32 animate-pulse rounded-md bg-muted" />
          <ArchiveGridSkeleton count={3} />
        </section>
      ))}
    </div>
  );
}

function ArchivePersonSection({ archives, participant }: ArchivePeopleSection) {
  const { isRpMode } = useRpModeSettings();
  const displayName = getDisplayName(participant, "clip-card", isRpMode);

  return (
    <section aria-labelledby={`archive-person-${participant.id}`} className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-muted text-brand-text">
          <UserRound aria-hidden="true" className="size-4" />
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-heading-sm font-semibold text-primary" id={`archive-person-${participant.id}`}>
            {displayName.primaryName}
          </h3>
          {displayName.secondaryName ? (
            <p className="mt-0.5 truncate text-body-sm text-secondary">{displayName.secondaryName}</p>
          ) : null}
        </div>
      </div>
      {archives.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {archives.map((archive) => <ArchiveCard archive={archive} key={archive.id} />)}
        </div>
      ) : (
        <p className="text-body-sm text-secondary">관련 공개 아카이브가 없습니다.</p>
      )}
    </section>
  );
}

function ArchivePeopleMessage({ children }: { children: string }) {
  return (
    <p className="rounded-xl border border-dashed border-default px-4 py-12 text-center text-body-sm text-secondary">
      {children}
    </p>
  );
}

function ArchivePeopleError({ isRetrying, onRetry }: { isRetrying: boolean; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-default px-4 py-12 text-center">
      <Archive aria-hidden="true" className="size-7 text-status-danger" />
      <p className="mt-3 text-body-sm text-status-danger" role="alert">인물별 아카이브를 불러오지 못했습니다.</p>
      <RetryButton isPending={isRetrying} onRetry={onRetry} />
    </div>
  );
}
