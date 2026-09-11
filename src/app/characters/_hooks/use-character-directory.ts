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
} from "@/constants/character-affiliations";
import {
  CHARACTER_DIRECTORY_MODE_VALUES,
  CHARACTER_SORT_VALUES,
  CHARACTER_VIEW_VALUES,
  type CharacterDirectoryMode,
  type CharacterSort,
  type CharacterView,
} from "@/constants/character-list";

import {
  getFilterQueryValue,
  getLegacyJobSelection,
  getStreamerAffiliationSelection,
  hasExplicitCharacterPreferences,
  readCharacterPreferences,
  writeCharacterPreferences,
  type CharacterPreferences,
} from "../_utils/character-preferences";

const characterQueryParsers = {
  q: parseAsString.withDefault(""),
  jobs: parseAsArrayOf(parseAsString).withDefault([]),
  affiliationType: parseAsStringLiteral(
    CHARACTER_AFFILIATION_CATEGORY_VALUES,
  ).withDefault("all"),
  affiliation: parseAsString.withDefault(""),
  groups: parseAsArrayOf(parseAsString).withDefault([]),
  sort: parseAsStringLiteral(CHARACTER_SORT_VALUES).withDefault("asc"),
  view: parseAsStringLiteral(CHARACTER_VIEW_VALUES).withDefault("grid"),
  mode: parseAsStringLiteral(CHARACTER_DIRECTORY_MODE_VALUES).withDefault(
    "streamer",
  ),
};

export interface CharacterDirectory {
  q: string;
  jobSelection: HierarchicalFilterSelection;
  streamerAffiliationSelection: HierarchicalFilterSelection;
  sort: CharacterSort;
  view: CharacterView;
  mode: CharacterDirectoryMode;
  changeQuery: (query: string) => void;
  applyJobs: (selection: HierarchicalFilterSelection) => void;
  applyStreamerAffiliations: (
    selection: HierarchicalFilterSelection,
  ) => void;
  removeStreamerAffiliation: (affiliationSlug: string) => void;
  removeJob: (jobId: string) => void;
  changeSort: (sort: CharacterSort) => void;
  changeView: (view: CharacterView) => void;
  changeMode: (mode: CharacterDirectoryMode) => void;
  resetFilters: () => void;
}

export function useCharacterDirectory(): CharacterDirectory {
  const [
    { q, jobs, affiliationType, affiliation, groups, sort, view, mode },
    setQueryState,
  ] = useQueryStates(characterQueryParsers);
  const hasRestoredPreferences = useRef(false);
  const streamerAffiliationSelection = getStreamerAffiliationSelection(groups);
  const jobSelection = getLegacyJobSelection(
    jobs,
    affiliationType,
    affiliation,
  );

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
        jobs: preferences.jobs.length > 0 ? preferences.jobs : null,
        affiliationType: null,
        affiliation: null,
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
      jobs: jobSelection.ids,
      groups: streamerAffiliationSelection.ids,
      sort,
      view,
      ...changes,
    };
  }

  function changeQuery(nextQuery: string) {
    void setQueryState({ q: nextQuery || null }, { history: "replace" });
  }

  function applyJobs(selection: HierarchicalFilterSelection) {
    const nextJobs = getFilterQueryValue(selection);
    writeCharacterPreferences(
      getPreferences({
        jobs: nextJobs ?? [],
      }),
    );
    void setQueryState(
      {
        jobs: nextJobs,
        affiliationType: null,
        affiliation: null,
      },
      { history: "replace" },
    );
  }

  function applyStreamerAffiliations(
    selection: HierarchicalFilterSelection,
  ) {
    const groups = getFilterQueryValue(selection);
    writeCharacterPreferences(
      getPreferences({
        groups: groups ?? [],
      }),
    );
    void setQueryState({ groups }, { history: "replace" });
  }

  function removeJob(jobId: string) {
    applyJobs({
      ids: jobSelection.ids.filter((selectedId) => selectedId !== jobId),
    });
  }

  function removeStreamerAffiliation(affiliationSlug: string) {
    applyStreamerAffiliations(
      {
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

  function changeMode(nextMode: CharacterDirectoryMode) {
    void setQueryState(
      { mode: nextMode === "streamer" ? null : nextMode },
      { history: "push" },
    );
  }

  function resetFilters() {
    writeCharacterPreferences(
      getPreferences({
        jobs: [],
        groups: [],
      }),
    );
    void setQueryState(
      {
        jobs: null,
        affiliationType: null,
        affiliation: null,
        groups: null,
      },
      { history: "replace" },
    );
  }

  return {
    q,
    jobSelection,
    streamerAffiliationSelection,
    sort,
    view,
    mode,
    changeQuery,
    applyJobs,
    applyStreamerAffiliations,
    removeStreamerAffiliation,
    removeJob,
    changeSort,
    changeView,
    changeMode,
    resetFilters,
  };
}
