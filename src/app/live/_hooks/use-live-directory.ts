"use client";

import {
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";

import type { HierarchicalFilterSelection } from "@/components/filters/hierarchical-filter";
import {
  LIVE_SORT_VALUES,
  type LiveSort,
} from "@/features/live/live-stream";

const liveQueryParsers = {
  q: parseAsString.withDefault(""),
  jobs: parseAsArrayOf(parseAsString).withDefault([]),
  groups: parseAsArrayOf(parseAsString).withDefault([]),
  sort: parseAsStringLiteral(LIVE_SORT_VALUES).withDefault("viewers"),
};

export interface LiveDirectory {
  q: string;
  jobSelection: HierarchicalFilterSelection;
  streamerAffiliationSelection: HierarchicalFilterSelection;
  sort: LiveSort;
  changeQuery: (query: string) => void;
  applyJobs: (selection: HierarchicalFilterSelection) => void;
  applyStreamerAffiliations: (
    selection: HierarchicalFilterSelection,
  ) => void;
  removeJob: (jobId: string) => void;
  removeStreamerAffiliation: (affiliationSlug: string) => void;
  changeSort: (sort: LiveSort) => void;
  resetFilters: () => void;
}

export function useLiveDirectory(): LiveDirectory {
  const [{ q, jobs, groups, sort }, setQueryState] =
    useQueryStates(liveQueryParsers);
  const jobSelection = { ids: jobs };
  const streamerAffiliationSelection = { ids: groups };

  function changeQuery(query: string) {
    void setQueryState({ q: query || null }, { history: "replace" });
  }

  function applyJobs(selection: HierarchicalFilterSelection) {
    void setQueryState(
      { jobs: getFilterQueryValue(selection) },
      { history: "replace" },
    );
  }

  function applyStreamerAffiliations(
    selection: HierarchicalFilterSelection,
  ) {
    void setQueryState(
      { groups: getFilterQueryValue(selection) },
      { history: "replace" },
    );
  }

  function removeJob(jobId: string) {
    applyJobs({
      ids: jobSelection.ids.filter((selectedId) => selectedId !== jobId),
    });
  }

  function removeStreamerAffiliation(affiliationSlug: string) {
    applyStreamerAffiliations({
      ids: streamerAffiliationSelection.ids.filter(
        (selectedSlug) => selectedSlug !== affiliationSlug,
      ),
    });
  }

  function changeSort(nextSort: LiveSort) {
    void setQueryState(
      { sort: nextSort === "viewers" ? null : nextSort },
      { history: "replace" },
    );
  }

  function resetFilters() {
    void setQueryState(
      { jobs: null, groups: null },
      { history: "replace" },
    );
  }

  return {
    q,
    jobSelection,
    streamerAffiliationSelection,
    sort,
    changeQuery,
    applyJobs,
    applyStreamerAffiliations,
    removeJob,
    removeStreamerAffiliation,
    changeSort,
    resetFilters,
  };
}

function getFilterQueryValue(
  selection: HierarchicalFilterSelection,
): string[] | null {
  const ids = Array.from(
    new Set(selection.ids.map((id) => id.trim()).filter(Boolean)),
  );

  return ids.length > 0 ? ids : null;
}
