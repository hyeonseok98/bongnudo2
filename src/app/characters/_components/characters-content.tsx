"use client";

import {
  getFilterNodeLabel,
  type HierarchicalFilterSelection,
} from "@/components/filters/hierarchical-filter";
import { Select } from "@/components/ui/select";

import { useCharacterDirectory } from "../_hooks/use-character-directory";
import { useCharacters } from "../_hooks/use-characters";
import {
  buildCharacterFilterFacetData,
  buildCharacterDirectoryItems,
  buildJobAffiliationFilterNodes,
  buildStreamerAffiliationFilterData,
  filterCharacters,
  sortCharacterDirectoryItems,
} from "../_utils/character-directory";
import { CharacterFilters } from "./character-filters";
import { CharacterGrid } from "./character-grid";
import { CharacterList } from "./character-list";
import { CharacterModeSwitch } from "./character-mode-switch";
import { CharacterViewToggle } from "./character-view-toggle";
import { SelectedFilterSummary } from "./selected-filter-summary";
import { Skeleton } from "@/components/ui/skeleton";

export function CharactersContent() {
  const directory = useCharacterDirectory();
  const charactersQuery = useCharacters();
  const characters = charactersQuery.data?.characters ?? [];
  const streamerAffiliations = charactersQuery.data?.streamerAffiliations ?? [];
  const allJobNodes = buildJobAffiliationFilterNodes(characters);
  const filterCriteria = {
    query: directory.q,
    jobSelection: directory.jobSelection,
    streamerAffiliationSelection: directory.streamerAffiliationSelection,
  };
  const filterFacetData = buildCharacterFilterFacetData(
    characters,
    streamerAffiliations,
    filterCriteria,
  );
  const allStreamerAffiliationFilterData = buildStreamerAffiliationFilterData(
    characters,
    streamerAffiliations,
  );
  const selectedStreamerAffiliations =
    directory.streamerAffiliationSelection.ids.map((slug) => ({
      slug,
      label:
        streamerAffiliations.find((affiliation) => affiliation.slug === slug)
          ?.name ?? slug,
    }));
  const selectedJobs = directory.jobSelection.ids.map((id) => ({
    id,
    label: getFilterNodeLabel(allJobNodes, id) ?? id,
  }));
  const filteredCharacters = filterCharacters(
    characters,
    filterCriteria,
    streamerAffiliations,
  );
  const directoryItems = sortCharacterDirectoryItems(
    buildCharacterDirectoryItems(filteredCharacters, directory.mode),
    directory.sort,
  );

  function getDirectoryResultCount(filtered: typeof characters) {
    return buildCharacterDirectoryItems(filtered, directory.mode).length;
  }

  function getJobResultCount(selection: HierarchicalFilterSelection) {
    const filtered = filterCharacters(
      characters,
      {
        ...filterCriteria,
        jobSelection: selection,
      },
      streamerAffiliations,
    );

    return getDirectoryResultCount(filtered);
  }

  function getStreamerAffiliationResultCount(
    selection: HierarchicalFilterSelection,
  ) {
    const filtered = filterCharacters(
      characters,
      {
        ...filterCriteria,
        streamerAffiliationSelection: selection,
      },
      streamerAffiliations,
    );

    return getDirectoryResultCount(filtered);
  }

  if (charactersQuery.isPending) {
    return (
      <div className="space-y-6">
        <CharacterDirectoryHeading
          mode={directory.mode}
          onModeChange={directory.changeMode}
        />
        <CharacterDirectorySkeleton view={directory.view} />
      </div>
    );
  }

  if (charactersQuery.isError) {
    return (
      <div className="space-y-6">
        <CharacterDirectoryHeading
          mode={directory.mode}
          onModeChange={directory.changeMode}
        />
        <p className="text-body-sm text-destructive" role="alert">
          인물 정보를 불러오지 못했습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CharacterDirectoryHeading
        mode={directory.mode}
        onModeChange={directory.changeMode}
      />

      <CharacterFilters
        getJobResultCount={getJobResultCount}
        getStreamerAffiliationResultCount={getStreamerAffiliationResultCount}
        jobLabelNodes={allJobNodes}
        jobNodes={filterFacetData.jobNodes}
        jobValue={directory.jobSelection}
        query={directory.q}
        streamerAffiliationSelection={directory.streamerAffiliationSelection}
        streamerAffiliationNodes={filterFacetData.streamerAffiliations.nodes}
        streamerAffiliationLabelNodes={allStreamerAffiliationFilterData.nodes}
        streamerAffiliationQuickOptions={
          filterFacetData.streamerAffiliations.quickOptions
        }
        onJobApply={directory.applyJobs}
        onQueryChange={directory.changeQuery}
        onStreamerAffiliationsApply={directory.applyStreamerAffiliations}
      />

      <SelectedFilterSummary
        selectedJobs={selectedJobs}
        selectedStreamerAffiliations={selectedStreamerAffiliations}
        onClearAll={directory.resetFilters}
        onRemoveJob={directory.removeJob}
        onRemoveStreamerAffiliation={directory.removeStreamerAffiliation}
      />

      <section
        aria-labelledby="character-results-heading"
        className="space-y-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2
            id="character-results-heading"
            className="text-body-sm text-secondary"
          >
            총{" "}
            <strong className="font-semibold text-brand-text">
              {directoryItems.length}명
            </strong>
            의 인물이 등록되어 있습니다.
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <CharacterViewToggle
              view={directory.view}
              onViewChange={directory.changeView}
            />
            <span className="ml-1 text-body-sm text-secondary">정렬</span>
            <Select
              label="인물 정렬"
              onValueChange={directory.changeSort}
              options={[
                { label: "가나다순 ↑", value: "asc" },
                { label: "가나다순 ↓", value: "desc" },
              ]}
              value={directory.sort}
            />
          </div>
        </div>

        <div className="min-h-[55vh]">
          {directoryItems.length > 0 ? (
            directory.view === "grid" ? (
              <CharacterGrid items={directoryItems} />
            ) : (
              <CharacterList items={directoryItems} />
            )
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center bg-surface-muted px-5 py-10 text-center">
              <p className="text-heading-sm font-semibold text-primary">
                조건에 맞는 인물이 없습니다.
              </p>
              <p className="mt-1 text-body-sm text-secondary">
                검색어나 선택한 필터를 변경해보세요.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function CharacterDirectorySkeleton({ view }: { view: "grid" | "list" }) {
  return (
    <div aria-label="인물 도감을 불러오는 중입니다." className="space-y-6" role="status">
      <div className="space-y-3">
        <Skeleton className="h-10 w-full max-w-2xl" />
        <div className="flex flex-wrap gap-4"><Skeleton className="h-10 w-44" /><Skeleton className="h-10 w-60" /></div>
      </div>
      <div className="flex min-h-8 items-center justify-between gap-3">
        <Skeleton className="h-4 w-48" />
        <div className="flex gap-2"><Skeleton className="h-9 w-28" /><Skeleton className="h-10 w-32" /></div>
      </div>
      {view === "grid" ? (
        <div className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {Array.from({ length: 12 }, (_, index) => (
            <Skeleton className="aspect-3/4 w-full rounded-xl" key={index} />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-default">
          <Skeleton className="h-12 w-full rounded-none" />
          <div className="divide-y divide-border-default">
            {Array.from({ length: 8 }, (_, index) => <Skeleton className="h-16 w-full rounded-none" key={index} />)}
          </div>
        </div>
      )}
    </div>
  );
}

interface CharacterDirectoryHeadingProps {
  mode: "streamer" | "rp";
  onModeChange: (mode: "streamer" | "rp") => void;
}

function CharacterDirectoryHeading({
  mode,
  onModeChange,
}: CharacterDirectoryHeadingProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-title font-bold text-primary">인물 도감</h1>
        <p className="mt-1 text-body text-secondary">
          봉누도에서 살아가는 인물들을 확인해보세요.
        </p>
      </div>
      <CharacterModeSwitch mode={mode} onModeChange={onModeChange} />
    </div>
  );
}
