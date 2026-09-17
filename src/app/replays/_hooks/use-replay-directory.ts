"use client";

import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from "nuqs";

import type { HierarchicalFilterSelection } from "@/components/filters/hierarchical-filter";
import type { ReplayListFilters } from "@/features/replays/replay";

const replayQueryParsers = {
  q: parseAsString.withDefault(""),
  groups: parseAsArrayOf(parseAsString).withDefault([]),
  jobs: parseAsArrayOf(parseAsString).withDefault([]),
  participant: parseAsArrayOf(parseAsString).withDefault([]),
  day: parseAsInteger,
  date: parseAsString,
};

export interface ReplayDirectory {
  date: string | null;
  day: number | null;
  filters: ReplayListFilters;
  groupSelection: HierarchicalFilterSelection;
  jobSelection: HierarchicalFilterSelection;
  participantIds: string[];
  query: string;
  applyGroups: (selection: HierarchicalFilterSelection) => void;
  applyJobs: (selection: HierarchicalFilterSelection) => void;
  changeDate: (date: string | null) => void;
  changeDay: (day: number | null) => void;
  changeParticipants: (participantIds: string[]) => void;
  changeQuery: (query: string) => void;
  resetFilters: () => void;
}

export function useReplayDirectory(): ReplayDirectory {
  const [{ q, groups, jobs, participant, day, date }, setQueryState] = useQueryStates(replayQueryParsers);

  function changeQuery(query: string) {
    void setQueryState({ q: query || null }, { history: "replace" });
  }

  function applyGroups(selection: HierarchicalFilterSelection) {
    void setQueryState({ groups: toFilterValues(selection) }, { history: "replace" });
  }

  function applyJobs(selection: HierarchicalFilterSelection) {
    void setQueryState({ jobs: toFilterValues(selection) }, { history: "replace" });
  }

  function changeParticipants(participantIds: string[]) {
    void setQueryState(
      { participant: participantIds.length > 0 ? participantIds : null },
      { history: "replace" },
    );
  }

  function changeDay(nextDay: number | null) {
    void setQueryState({ date: null, day: nextDay }, { history: "replace" });
  }

  function changeDate(nextDate: string | null) {
    void setQueryState({ date: nextDate, day: null }, { history: "replace" });
  }

  function resetFilters() {
    void setQueryState(
      { q: null, groups: null, jobs: null, participant: null, day: null, date: null },
      { history: "replace" },
    );
  }

  return {
    date,
    day,
    filters: { date, day, groups, jobs, participantIds: participant, query: q },
    groupSelection: { ids: groups },
    jobSelection: { ids: jobs },
    participantIds: participant,
    query: q,
    applyGroups,
    applyJobs,
    changeDate,
    changeDay,
    changeParticipants,
    changeQuery,
    resetFilters,
  };
}

function toFilterValues(selection: HierarchicalFilterSelection): string[] | null {
  const values = Array.from(new Set(selection.ids.map((id) => id.trim()).filter(Boolean)));
  return values.length > 0 ? values : null;
}
