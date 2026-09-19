"use client";

import Link from "next/link";

import { useQuery } from "@tanstack/react-query";
import { Archive, Building2, Clapperboard, UserRound, X } from "lucide-react";

import { ArchiveGridSkeleton } from "@/components/archive-grid-skeleton";
import { ParticipantFilter } from "@/components/filters/participant-filter";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { RetryButton } from "@/components/ui/retry-button";
import type { ArchivePersonDetail } from "@/features/archives/archive";
import { archiveQueries } from "@/queries/archive-queries";
import { cn } from "@/utils/cn";

import { useArchiveDirectory } from "../_hooks/use-archive-directory";
import { ArchiveCard } from "./archive-card";

export function ArchivePeopleView() {
  const directory = useArchiveDirectory();
  const personQuery = useQuery(archiveQueries.person(directory.participantId));

  return (
    <section aria-labelledby="archive-people-heading" className="space-y-7">
      <div>
        <h2 className="text-heading font-semibold text-primary" id="archive-people-heading">인물별 탐색</h2>
        <p className="mt-2 text-body text-secondary">RP명 또는 스트리머명으로 인물을 찾아 기록을 살펴보세요.</p>
      </div>

      <ParticipantFilter
        className="w-full sm:max-w-sm"
        onValueChange={(participantIds) => directory.changeParticipant(participantIds[0] ?? null)}
        selectionMode="single"
        value={directory.participantId ? [directory.participantId] : []}
      />

      {directory.participantId === null ? (
        <ArchivePeopleMessage>인물을 검색해 선택해주세요.</ArchivePeopleMessage>
      ) : null}
      {directory.participantId !== null && personQuery.isPending ? (
        <ArchivePeopleLoadingState />
      ) : null}
      {personQuery.isError ? <ArchivePeopleError isRetrying={personQuery.isFetching} onRetry={() => void personQuery.refetch()} /> : null}
      {personQuery.data ? (
        <ArchivePersonResult
          detail={personQuery.data}
          onClear={() => directory.changeParticipant(null)}
        />
      ) : null}
    </section>
  );
}

function ArchivePeopleLoadingState() {
  return (
    <div className="space-y-6" role="status">
      <div className="rounded-xl border border-default bg-surface-raised p-5">
        <div className="h-5 w-24 animate-pulse rounded-md bg-muted" />
        <div className="mt-3 h-4 w-40 animate-pulse rounded-md bg-muted" />
      </div>
      <ArchiveGridSkeleton count={3} />
    </div>
  );
}

function ArchivePersonResult({
  detail,
  onClear,
}: {
  detail: ArchivePersonDetail;
  onClear: () => void;
}) {
  return (
    <div className="space-y-9">
      <section aria-labelledby="archive-person-info-heading" className="rounded-xl border border-default bg-surface-raised p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-muted text-brand-text">
              <UserRound aria-hidden="true" className="size-5" />
            </div>
            <div>
              <h3 className="text-heading-sm font-semibold text-primary" id="archive-person-info-heading">
                {detail.participant.rpName ?? "RP 정보 없음"}
              </h3>
              <p className="mt-1 text-body-sm text-secondary">스트리머명 {detail.participant.streamerName}</p>
            </div>
          </div>
          <Button className="self-start" onClick={onClear} size="sm" type="button" variant="ghost">
            <X aria-hidden="true" />
            선택 해제
          </Button>
        </div>

        <div className="mt-5 border-t border-default pt-4">
          <div className="flex items-center gap-2 text-body-sm font-medium text-primary">
            <Building2 aria-hidden="true" className="size-4 text-brand-text" />
            현재 소속 및 직업
          </div>
          {detail.participant.affiliations.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {detail.participant.affiliations.map((affiliation) => (
                <Badge key={`${affiliation.organizationSlug}-${affiliation.role ?? "none"}`} variant="outline">
                  {affiliation.organizationName}{affiliation.role ? ` · ${affiliation.role}` : ""}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-body-sm text-secondary">현재 소속 또는 직업 정보가 없습니다.</p>
          )}
        </div>
      </section>

      <section aria-labelledby="archive-person-system-heading" className="space-y-3">
        <div>
          <h3 className="text-heading-sm font-semibold text-primary" id="archive-person-system-heading">전체 클립</h3>
          <p className="mt-1 text-body-sm text-secondary">이 인물의 봉누도2 클립 기록을 모아봅니다.</p>
        </div>
        {detail.systemArchiveId ? (
          <Link className={cn(buttonVariants({ variant: "outline" }), "w-fit")} href={`/archives/${detail.systemArchiveId}`}>
            <Clapperboard aria-hidden="true" />
            전체 클립 보기
          </Link>
        ) : (
          <ArchivePeopleMessage>전체 클립 기록이 없습니다.</ArchivePeopleMessage>
        )}
      </section>

      <section aria-labelledby="archive-person-related-heading" className="space-y-4 border-t border-default pt-7">
        <div>
          <h3 className="text-heading-sm font-semibold text-primary" id="archive-person-related-heading">관련 사용자 아카이브</h3>
          <p className="mt-1 text-body-sm text-secondary">이 인물이 포함된 공개 아카이브입니다.</p>
        </div>
        {detail.relatedArchives.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {detail.relatedArchives.map((archive) => <ArchiveCard archive={archive} key={archive.id} />)}
          </div>
        ) : (
          <ArchivePeopleMessage>관련 공개 아카이브가 없습니다.</ArchivePeopleMessage>
        )}
      </section>
    </div>
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
