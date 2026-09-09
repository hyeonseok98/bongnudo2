"use client";

import { useEffect, useRef } from "react";
import {
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";

import {
  CHARACTER_AFFILIATION_CATEGORY_VALUES,
  type CharacterAffiliationCategoryFilter,
} from "@/constants/character-affiliations";
import {
  CHARACTER_SORT_VALUES,
  CHARACTER_VIEW_VALUES,
  type CharacterSort,
  type CharacterView,
} from "@/constants/character-list";

import {
  hasExplicitCharacterPreferences,
  normalizeGroupIds,
  readCharacterPreferences,
  writeCharacterPreferences,
  type CharacterPreferences,
} from "../_utils/character-preferences";

const characterQueryParsers = {
  q: parseAsString.withDefault(""),
  affiliationType: parseAsStringLiteral(
    CHARACTER_AFFILIATION_CATEGORY_VALUES,
  ).withDefault("all"),
  affiliation: parseAsString.withDefault(""),
  groups: parseAsArrayOf(parseAsString).withDefault([]),
  sort: parseAsStringLiteral(CHARACTER_SORT_VALUES).withDefault("asc"),
  view: parseAsStringLiteral(CHARACTER_VIEW_VALUES).withDefault("grid"),
};

export interface CharacterDirectory {
  q: string;
  affiliationType: CharacterAffiliationCategoryFilter;
  affiliation: string | null;
  selectedStreamerAffiliationSlugs: string[];
  sort: CharacterSort;
  view: CharacterView;
  changeQuery: (query: string) => void;
  applyJobAffiliation: (
    affiliationType: CharacterAffiliationCategoryFilter,
    affiliation: string | null,
  ) => void;
  applyStreamerAffiliations: (affiliationSlugs: string[]) => void;
  removeStreamerAffiliation: (affiliationSlug: string) => void;
  changeSort: (sort: CharacterSort) => void;
  changeView: (view: CharacterView) => void;
  resetFilters: () => void;
}

export function useCharacterDirectory(): CharacterDirectory {
  const [
    { q, affiliationType, affiliation, groups, sort, view },
    setQueryState,
  ] = useQueryStates(characterQueryParsers);
  const hasRestoredPreferences = useRef(false);
  const selectedStreamerAffiliationSlugs = normalizeGroupIds(groups);
  const selectedAffiliation = affiliation || null;

  useEffect(() => {
    if (hasRestoredPreferences.current) {
      return;
    }

    hasRestoredPreferences.current = true;

    if (hasExplicitCharacterPreferences(window.location.search)) {
      return;
    }

    const preferences = readCharacterPreferences();

    if (!preferences) {
      return;
    }

    void setQueryState(
      {
        affiliationType:
          preferences.affiliationType === "all"
            ? null
            : preferences.affiliationType,
        affiliation: preferences.affiliation,
        groups: preferences.groups.length > 0 ? preferences.groups : null,
        sort: preferences.sort === "asc" ? null : preferences.sort,
        view: preferences.view === "grid" ? null : preferences.view,
      },
      { history: "replace" },
    );
  }, [setQueryState]);

  function getPreferences(
    changes: Partial<CharacterPreferences> = {},
  ): CharacterPreferences {
    return {
      affiliationType,
      affiliation: selectedAffiliation,
      groups: selectedStreamerAffiliationSlugs,
      sort,
      view,
      ...changes,
    };
  }

  function changeQuery(nextQuery: string) {
    void setQueryState({ q: nextQuery || null }, { history: "replace" });
  }

  function applyJobAffiliation(
    nextType: CharacterAffiliationCategoryFilter,
    nextAffiliation: string | null,
  ) {
    writeCharacterPreferences(
      getPreferences({
        affiliationType: nextType,
        affiliation: nextAffiliation,
      }),
    );
    void setQueryState(
      {
        affiliationType: nextType === "all" ? null : nextType,
        affiliation: nextAffiliation,
      },
      { history: "replace" },
    );
  }

  function applyStreamerAffiliations(affiliationSlugs: string[]) {
    const normalizedSlugs = normalizeGroupIds(affiliationSlugs);
    writeCharacterPreferences(getPreferences({ groups: normalizedSlugs }));
    void setQueryState(
      { groups: normalizedSlugs.length > 0 ? normalizedSlugs : null },
      { history: "replace" },
    );
  }

  function removeStreamerAffiliation(affiliationSlug: string) {
    applyStreamerAffiliations(
      selectedStreamerAffiliationSlugs.filter(
        (selectedSlug) => selectedSlug !== affiliationSlug,
      ),
    );
  }

  function changeSort(nextSort: CharacterSort) {
    writeCharacterPreferences(getPreferences({ sort: nextSort }));
    void setQueryState(
      { sort: nextSort === "asc" ? null : nextSort },
      { history: "replace" },
    );
  }

  function changeView(nextView: CharacterView) {
    writeCharacterPreferences(getPreferences({ view: nextView }));
    void setQueryState(
      { view: nextView === "grid" ? null : nextView },
      { history: "replace" },
    );
  }

  function resetFilters() {
    writeCharacterPreferences(
      getPreferences({
        affiliationType: "all",
        affiliation: null,
        groups: [],
      }),
    );
    void setQueryState(
      { affiliationType: null, affiliation: null, groups: null },
      { history: "replace" },
    );
  }

  return {
    q,
    affiliationType,
    affiliation: selectedAffiliation,
    selectedStreamerAffiliationSlugs,
    sort,
    view,
    changeQuery,
    applyJobAffiliation,
    applyStreamerAffiliations,
    removeStreamerAffiliation,
    changeSort,
    changeView,
    resetFilters,
  };
}
