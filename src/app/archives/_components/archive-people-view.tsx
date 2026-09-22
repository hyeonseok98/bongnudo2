"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Archive, LoaderCircle, UserRound } from "lucide-react";
import { useState } from "react";
import { parseAsString, useQueryState } from "nuqs";

import { ArchiveGridSkeleton } from "@/components/archive-grid-skeleton";
import type { HierarchicalFilterSelection } from "@/components/filters/hierarchical-filter";
import { RetryButton } from "@/components/ui/retry-button";
import type { ArchivePeopleSection } from "@/features/archives/archive";
import { getDisplayName } from "@/features/rp-mode/rp-mode";
import { useRpModeSettings } from "@/providers/rp-mode-provider";
import { archiveQueries } from "@/queries/archive-queries";
import { characterQueries } from "@/queries/character-queries";
import { ClipInfiniteScrollTrigger } from "@/app/clips/_components/clip-infinite-scroll-trigger";

import { CharacterFilters } from "../../characters/_components/character-filters";
import { SelectedFilterSummary } from "../../characters/_components/selected-filter-summary";
import {
  buildCharacterFilterFacetData,
  buildJobAffiliationFilterNodes,
  buildStreamerAffiliationFilterData,
  filterCharacters,
  getStreamerAffiliationFilterLabel,
} from "../../characters/_utils/character-directory";
import { ArchiveCard } from "./archive-card";

const EMPTY_SELECTION: HierarchicalFilterSelection = { ids: [] };

export function ArchivePeopleView() {
  const [participantId, setParticipantId] = useQueryState("participant", parseAsString);
  const [query, setQuery] = useState("");
  const [jobSelection, setJobSelection] = useState(EMPTY_SELECTION);
  const [streamerAffiliationSelection, setStreamerAffiliationSelection] = useState(EMPTY_SELECTION);
  const charactersQuery = useQuery(characterQueries.list());
  const characters = charactersQuery.data?.characters ?? [];
  const streamerAffiliations = charactersQuery.data?.streamerAffiliations ?? [];
  const criteria = { query, jobSelection, streamerAffiliationSelection };
  const peopleQuery = useInfiniteQuery({
    ...archiveQueries.people({
      participantId,
      affiliations: streamerAffiliationSelection.ids,
      jobs: jobSelection.ids,
      query: query.trim(),
    }),
    enabled: charactersQuery.isSuccess,
  });
  const sections = peopleQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const visibleSections = sections.filter((section) => section.archives.length > 0);
  const allJobNodes = buildJobAffiliationFilterNodes(characters);
  const allStreamerAffiliationFilterData = buildStreamerAffiliationFilterData(
    characters,
    streamerAffiliations,
  );
  const facetData = buildCharacterFilterFacetData(characters, streamerAffiliations, criteria);

  function getResultCount(
    nextJobSelection: HierarchicalFilterSelection,
    nextStreamerAffiliationSelection: HierarchicalFilterSelection,
  ) {
    return filterCharacters(characters, {
      query,
      jobSelection: nextJobSelection,
      streamerAffiliationSelection: nextStreamerAffiliationSelection,
    }, streamerAffiliations).length;
  }

  return (
    <section aria-labelledby="archive-people-heading" className="space-y-7">
      <div>
        <h2 className="text-heading font-semibold text-primary" id="archive-people-heading">인물별 탐색</h2>
        <p className="mt-2 text-body text-secondary">인물과 함께 남은 공개 아카이브를 살펴보세요.</p>
      </div>

      {participantId ? <button type="button" className="cursor-pointer text-body-sm text-brand-text hover:underline" onClick={() => void setParticipantId(null)}>모든 인물 보기</button> : null}

      {charactersQuery.data ? (
        <>
          <CharacterFilters
            getJobResultCount={(selection) => getResultCount(selection, streamerAffiliationSelection)}
            getStreamerAffiliationResultCount={(selection) => getResultCount(jobSelection, selection)}
            jobLabelNodes={allJobNodes}
            jobNodes={facetData.jobNodes}
            jobValue={jobSelection}
            onJobApply={setJobSelection}
            onQueryChange={setQuery}
            onStreamerAffiliationsApply={setStreamerAffiliationSelection}
            query={query}
            streamerAffiliationLabelNodes={allStreamerAffiliationFilterData.nodes}
            streamerAffiliationNodes={facetData.streamerAffiliations.nodes}
            streamerAffiliationQuickOptions={facetData.streamerAffiliations.quickOptions}
            streamerAffiliationSelection={streamerAffiliationSelection}
          />
          <SelectedFilterSummary
            onClearAll={() => {
              setJobSelection(EMPTY_SELECTION);
              setStreamerAffiliationSelection(EMPTY_SELECTION);
            }}
            onRemoveJob={(jobId) => setJobSelection({
              ids: jobSelection.ids.filter((id) => id !== jobId),
            })}
            onRemoveStreamerAffiliation={(slug) => setStreamerAffiliationSelection({
              ids: streamerAffiliationSelection.ids.filter((id) => id !== slug),
            })}
            selectedJobs={jobSelection.ids.map((id) => ({
              id,
              label: findFilterLabel(allJobNodes, id),
            }))}
            selectedStreamerAffiliations={streamerAffiliationSelection.ids.map((slug) => ({
              label: getStreamerAffiliationFilterLabel(streamerAffiliations, slug) ?? slug,
              slug,
            }))}
          />
        </>
      ) : null}

      {charactersQuery.isPending || peopleQuery.isPending ? <ArchivePeopleLoadingState /> : null}
      {charactersQuery.isError || peopleQuery.isError ? (
        <ArchivePeopleError
          isRetrying={charactersQuery.isFetching || peopleQuery.isFetching}
          onRetry={() => {
            void charactersQuery.refetch();
            void peopleQuery.refetch();
          }}
        />
      ) : null}
      {visibleSections.length > 0 || peopleQuery.hasNextPage ? (
        <div className="space-y-10">
          <div className="flex min-h-5 justify-end">
            <LoaderCircle
              aria-label="인물별 아카이브를 업데이트하는 중입니다."
              className={peopleQuery.isFetching && !peopleQuery.isFetchingNextPage
                ? "size-4 animate-spin text-tertiary"
                : "invisible size-4"}
            />
          </div>
          {visibleSections.map((section) => (
            <ArchivePersonSection
              archives={section.archives}
              key={section.participant.id}
              participant={section.participant}
            />
          ))}
          {peopleQuery.isFetchingNextPage ? <ArchivePeopleNextPageSkeleton /> : null}
          <ClipInfiniteScrollTrigger
            hasNextPage={peopleQuery.hasNextPage}
            idleMessage={null}
            isFetchingNextPage={peopleQuery.isFetchingNextPage}
            loadingMessage="다음 인물별 아카이브를 불러오는 중입니다."
            onLoadMore={() => void peopleQuery.fetchNextPage()}
            requireUserScroll
          />
        </div>
      ) : null}
      {peopleQuery.isSuccess && !peopleQuery.hasNextPage && visibleSections.length === 0 ? (
        <ArchivePeopleMessage>인물과 연결된 공개 아카이브가 없습니다.</ArchivePeopleMessage>
      ) : null}
    </section>
  );
}

function findFilterLabel(
  nodes: Array<{ children?: Array<{ id: string; label: string }>; id: string; label: string }>,
  id: string,
): string {
  for (const node of nodes) {
    if (node.id === id) return node.label;
    const child = node.children?.find((candidate) => candidate.id === id);
    if (child) return child.label;
  }

  return id;
}

function ArchivePeopleNextPageSkeleton() {
  return (
    <div aria-label="다음 인물별 아카이브를 불러오는 중입니다." className="space-y-10" role="status">
      {Array.from({ length: 3 }, (_, index) => (
        <section className="space-y-4" key={index}>
          <div className="h-6 w-32 animate-pulse rounded-md bg-surface-muted" />
          <ArchiveGridSkeleton count={3} />
        </section>
      ))}
    </div>
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

  if (archives.length === 0) return null;

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {archives.map((archive) => <ArchiveCard archive={archive} key={archive.id} />)}
      </div>
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
