"use client";

import { Select } from "@/components/ui/select";
import { CHARACTER_AFFILIATION_CATEGORIES } from "@/constants/character-affiliations";
import { CHARACTER_GROUPS } from "@/constants/character-groups";
import { isCharacterSort } from "@/constants/character-list";

import { CHARACTER_FIXTURES } from "../_fixtures/characters";
import { useCharacterDirectory } from "../_hooks/use-character-directory";
import { useCharacters } from "../_hooks/use-characters";
import {
  filterCharacters,
  getAvailableAffiliations,
  sortCharacters,
} from "../_utils/character-directory";
import { mergeCharactersWithFixtures } from "../_utils/merge-character-fixtures";
import { CharacterFilters } from "./character-filters";
import { CharacterGrid } from "./character-grid";
import { CharacterList } from "./character-list";
import { CharacterViewToggle } from "./character-view-toggle";
import { SelectedFilterSummary } from "./selected-filter-summary";

export function CharactersContent() {
  const directory = useCharacterDirectory();
  const charactersQuery = useCharacters();
  const characters = charactersQuery.data
    ? mergeCharactersWithFixtures(
        charactersQuery.data,
        CHARACTER_FIXTURES,
      )
    : CHARACTER_FIXTURES;
  const availableAffiliations = getAvailableAffiliations(
    characters,
    directory.affiliationType,
  );
  const selectedAffiliation =
    availableAffiliations.find(
      (affiliation) => affiliation.slug === directory.affiliation,
    ) ?? null;
  const selectedGroups = CHARACTER_GROUPS.filter((group) =>
    directory.selectedGroupIds.includes(group.slug),
  );
  const affiliationCategory =
    CHARACTER_AFFILIATION_CATEGORIES.find(
      (category) => category.slug === directory.affiliationType,
    ) ?? null;
  const filteredCharacters = filterCharacters(characters, {
    query: directory.q,
    affiliationType: directory.affiliationType,
    affiliationSlug: selectedAffiliation?.slug ?? null,
    selectedGroupIds: directory.selectedGroupIds,
  });
  const sortedCharacters = sortCharacters(
    filteredCharacters,
    directory.sort,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-title font-bold text-primary">인물 도감</h1>
        <p className="mt-1 text-body text-secondary">
          봉누도에서 살아가는 인물들을 확인해보세요.
        </p>
      </div>

      {charactersQuery.isPending ? (
        <p className="text-body-sm text-secondary" role="status">
          인물 정보를 불러오는 중입니다.
        </p>
      ) : charactersQuery.isError ? (
        <p className="text-body-sm text-destructive" role="alert">
          인물 정보를 불러오지 못했습니다. 임시 데이터를 표시합니다.
        </p>
      ) : null}

      <CharacterFilters
        affiliation={selectedAffiliation?.slug ?? null}
        affiliationType={directory.affiliationType}
        affiliations={availableAffiliations}
        query={directory.q}
        selectedGroupIds={directory.selectedGroupIds}
        onAffiliationChange={directory.selectAffiliation}
        onAffiliationTypeChange={directory.selectAffiliationType}
        onClearGroups={directory.clearGroups}
        onGroupToggle={directory.toggleGroup}
        onQueryChange={directory.changeQuery}
      />

      <SelectedFilterSummary
        affiliationFilter={
          selectedAffiliation
            ? { label: selectedAffiliation.name, isDetail: true }
            : directory.affiliationType !== "all" && affiliationCategory
              ? { label: affiliationCategory.name, isDetail: false }
              : null
        }
        selectedGroups={selectedGroups}
        onClearAffiliation={directory.clearAffiliation}
        onClearAll={directory.resetFilters}
        onRemoveGroup={directory.toggleGroup}
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
