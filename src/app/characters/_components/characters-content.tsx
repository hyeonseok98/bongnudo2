"use client";

import { getFilterNodeLabel } from "@/components/filters/hierarchical-filter";
import { Select } from "@/components/ui/select";
import { isCharacterSort } from "@/constants/character-list";

import { useCharacterDirectory } from "../_hooks/use-character-directory";
import { useCharacters } from "../_hooks/use-characters";
import {
  buildCharacterFilterFacetData,
  buildJobAffiliationFilterNodes,
  buildStreamerAffiliationFilterData,
  filterCharacters,
  getJobAffiliationFilterSelection,
  getJobAffiliationFilterValue,
  getStreamerAffiliationFilterLabel,
  sortCharacters,
} from "../_utils/character-directory";
import { CharacterFilters } from "./character-filters";
import { CharacterGrid } from "./character-grid";
import { CharacterList } from "./character-list";
import { CharacterViewToggle } from "./character-view-toggle";
import { SelectedFilterSummary } from "./selected-filter-summary";

export function CharactersContent() {
  const directory = useCharacterDirectory();
  const charactersQuery = useCharacters();
  const characters = charactersQuery.data?.characters ?? [];
  const streamerAffiliations =
    charactersQuery.data?.streamerAffiliations ?? [];
  const allJobNodes = buildJobAffiliationFilterNodes(characters);
  const jobValue = getJobAffiliationFilterValue(
    directory.affiliationType,
    directory.affiliation,
  );
  const appliedJobSelection = getJobAffiliationFilterSelection(
    allJobNodes,
    jobValue,
  );
  const filterCriteria = {
    query: directory.q,
    affiliationType: appliedJobSelection.affiliationType,
    affiliationSlug: appliedJobSelection.affiliationSlug,
    selectedStreamerAffiliationSlugs:
      directory.selectedStreamerAffiliationSlugs,
  };
  const filterFacetData = buildCharacterFilterFacetData(
    characters,
    streamerAffiliations,
    filterCriteria,
  );
  const allStreamerAffiliationFilterData =
    buildStreamerAffiliationFilterData(characters, streamerAffiliations);
  const selectedStreamerAffiliations =
    directory.selectedStreamerAffiliationSlugs.map((slug) => ({
      slug,
      label:
        getStreamerAffiliationFilterLabel(streamerAffiliations, slug) ?? slug,
    }));
  const filteredCharacters = filterCharacters(characters, filterCriteria);
  const sortedCharacters = sortCharacters(filteredCharacters, directory.sort);

  function getJobResultCount(value: string[]) {
    const selection = getJobAffiliationFilterSelection(allJobNodes, value);

    return filterCharacters(characters, {
      ...filterCriteria,
      affiliationType: selection.affiliationType,
      affiliationSlug: selection.affiliationSlug,
    }).length;
  }

  function getStreamerAffiliationResultCount(value: string[]) {
    return filterCharacters(characters, {
      ...filterCriteria,
      selectedStreamerAffiliationSlugs: value,
    }).length;
  }

  function handleJobApply(value: string[]) {
    const selection = getJobAffiliationFilterSelection(allJobNodes, value);
    directory.applyJobAffiliation(
      selection.affiliationType,
      selection.affiliationSlug,
    );
  }

  if (charactersQuery.isPending) {
    return (
      <div className="space-y-6">
        <CharacterDirectoryHeading />
        <p className="text-body-sm text-secondary" role="status">
          인물 정보를 불러오는 중입니다.
        </p>
      </div>
    );
  }

  if (charactersQuery.isError) {
    return (
      <div className="space-y-6">
        <CharacterDirectoryHeading />
        <p className="text-body-sm text-destructive" role="alert">
          인물 정보를 불러오지 못했습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CharacterDirectoryHeading />

      <CharacterFilters
        getJobResultCount={getJobResultCount}
        getStreamerAffiliationResultCount={
          getStreamerAffiliationResultCount
        }
        jobLabelNodes={allJobNodes}
        jobNodes={filterFacetData.jobNodes}
        jobValue={getJobAffiliationFilterValue(
          appliedJobSelection.affiliationType,
          appliedJobSelection.affiliationSlug,
        )}
        query={directory.q}
        selectedStreamerAffiliationSlugs={
          directory.selectedStreamerAffiliationSlugs
        }
        streamerAffiliationNodes={filterFacetData.streamerAffiliations.nodes}
        streamerAffiliationLabelNodes={
          allStreamerAffiliationFilterData.nodes
        }
        streamerAffiliationQuickOptions={
          filterFacetData.streamerAffiliations.quickOptions
        }
        onJobApply={handleJobApply}
        onQueryChange={directory.changeQuery}
        onStreamerAffiliationsApply={directory.applyStreamerAffiliations}
      />

      <SelectedFilterSummary
        affiliationFilter={
          jobValue.length > 0
            ? {
                label:
                  getFilterNodeLabel(allJobNodes, jobValue[0]) ?? jobValue[0],
              }
            : null
        }
        selectedStreamerAffiliations={selectedStreamerAffiliations}
        onClearAffiliation={() => directory.applyJobAffiliation("all", null)}
        onClearAll={directory.resetFilters}
        onRemoveStreamerAffiliation={directory.removeStreamerAffiliation}
      />

      <section aria-labelledby="character-results-heading" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2
            id="character-results-heading"
            className="text-body-sm text-secondary"
          >
            총{" "}
            <strong className="font-semibold text-brand-text">
              {sortedCharacters.length}명
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
              onChange={(event) => {
                if (isCharacterSort(event.target.value)) {
                  directory.changeSort(event.target.value);
                }
              }}
              value={directory.sort}
            >
              <option value="asc">가나다순 ↑</option>
              <option value="desc">가나다순 ↓</option>
            </Select>
          </div>
        </div>

        {sortedCharacters.length > 0 ? (
          directory.view === "grid" ? (
            <CharacterGrid characters={sortedCharacters} />
          ) : (
            <CharacterList characters={sortedCharacters} />
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
      </section>
    </div>
  );
}

function CharacterDirectoryHeading() {
  return (
    <div>
      <h1 className="text-title font-bold text-primary">인물 도감</h1>
      <p className="mt-1 text-body text-secondary">
        봉누도에서 살아가는 인물들을 확인해보세요.
      </p>
    </div>
  );
}
