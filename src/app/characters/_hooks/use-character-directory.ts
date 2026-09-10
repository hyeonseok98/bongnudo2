"use client";

import { useEffect, useRef } from "react";
import {
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";

import type { HierarchicalFilterSelection } from "@/components/filters/hierarchical-filter";
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
  getStreamerAffiliationQueryState,
  getStreamerAffiliationSelection,
  hasExplicitCharacterPreferences,
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
  excludeGroups: parseAsArrayOf(parseAsString).withDefault([]),
  sort: parseAsStringLiteral(CHARACTER_SORT_VALUES).withDefault("asc"),
  view: parseAsStringLiteral(CHARACTER_VIEW_VALUES).withDefault("grid"),
};

export interface CharacterDirectory {
  q: string;
  affiliationType: CharacterAffiliationCategoryFilter;
  affiliation: string | null;
  streamerAffiliationSelection: HierarchicalFilterSelection;
  sort: CharacterSort;
  view: CharacterView;
  changeQuery: (query: string) => void;
  applyJobAffiliation: (
    affiliationType: CharacterAffiliationCategoryFilter,
    affiliation: string | null,
  ) => void;
  applyStreamerAffiliations: (
    selection: HierarchicalFilterSelection,
  ) => void;
  removeStreamerAffiliation: (affiliationSlug: string) => void;
  changeSort: (sort: CharacterSort) => void;
  changeView: (view: CharacterView) => void;
  resetFilters: () => void;
}

export function useCharacterDirectory(): CharacterDirectory {
  const [
    { q, affiliationType, affiliation, groups, excludeGroups, sort, view },
    setQueryState,
  ] = useQueryStates(characterQueryParsers);
  const hasRestoredPreferences = useRef(false);
  const streamerAffiliationSelection = getStreamerAffiliationSelection(
    groups,
    excludeGroups,
  );
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
        excludeGroups:
          preferences.excludeGroups.length > 0
            ? preferences.excludeGroups
            : null,
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
      groups:
        streamerAffiliationSelection.mode === "include"
          ? streamerAffiliationSelection.ids
          : [],
      excludeGroups:
        streamerAffiliationSelection.mode === "exclude"
          ? streamerAffiliationSelection.ids
          : [],
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

  function applyStreamerAffiliations(
    selection: HierarchicalFilterSelection,
  ) {
    const queryState = getStreamerAffiliationQueryState(selection);
    writeCharacterPreferences(
      getPreferences({
        groups: queryState.groups ?? [],
        excludeGroups: queryState.excludeGroups ?? [],
      }),
    );
    void setQueryState(queryState, { history: "replace" });
  }

  function removeStreamerAffiliation(affiliationSlug: string) {
    applyStreamerAffiliations(
      {
        ...streamerAffiliationSelection,
        ids: streamerAffiliationSelection.ids.filter(
          (selectedSlug) => selectedSlug !== affiliationSlug,
        ),
      },
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
        excludeGroups: [],
      }),
    );
    void setQueryState(
      {
        affiliationType: null,
        affiliation: null,
        groups: null,
        excludeGroups: null,
      },
      { history: "replace" },
    );
  }

  return {
    q,
    affiliationType,
    affiliation: selectedAffiliation,
    streamerAffiliationSelection,
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
