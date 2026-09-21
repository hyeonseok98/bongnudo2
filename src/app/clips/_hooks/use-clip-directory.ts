"use client";

import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";

import type { HierarchicalFilterSelection } from "@/components/filters/hierarchical-filter";
import {
  CLIP_SORT_VALUES,
  CLIP_VIEW_VALUES,
  type ClipListFilters,
  type ClipSort,
  type ClipView,
} from "@/features/clips/clip";

const clipQueryParsers = {
  q: parseAsString.withDefault(""),
  groups: parseAsArrayOf(parseAsString).withDefault([]),
  jobs: parseAsArrayOf(parseAsString).withDefault([]),
  participant: parseAsArrayOf(parseAsString).withDefault([]),
  tags: parseAsArrayOf(parseAsString).withDefault([]),
  day: parseAsInteger,
  date: parseAsString,
  dateFrom: parseAsString,
  dateTo: parseAsString,
  sort: parseAsStringLiteral(CLIP_SORT_VALUES).withDefault("latest"),
  view: parseAsStringLiteral(CLIP_VIEW_VALUES).withDefault("timeline"),
};

export interface ClipDirectory {
  date: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  day: number | null;
  filters: ClipListFilters;
  groupSelection: HierarchicalFilterSelection;
  jobSelection: HierarchicalFilterSelection;
  participantIds: string[];
  tagIds: string[];
  query: string;
  sort: ClipSort;
  view: ClipView;
  applyGroups: (selection: HierarchicalFilterSelection) => void;
  applyJobs: (selection: HierarchicalFilterSelection) => void;
  changeDate: (date: string | null) => void;
  changeDateRange: (dateFrom: string | null, dateTo: string | null) => void;
  changeDay: (day: number | null) => void;
  changeParticipants: (participantIds: string[]) => void;
  changeTags: (tagIds: string[]) => void;
  changeQuery: (query: string) => void;
  changeSort: (sort: ClipSort) => void;
  changeView: (view: ClipView) => void;
  resetFilters: () => void;
}

export function useClipDirectory(): ClipDirectory {
  const [{ q, groups, jobs, participant, tags, day, date, dateFrom, dateTo, sort, view }, setQueryState] =
    useQueryStates(clipQueryParsers);

  function changeQuery(query: string) {
    void setQueryState({ q: query || null }, { history: "replace" });
  }

  function applyGroups(selection: HierarchicalFilterSelection) {
    void setQueryState(
      { groups: toFilterValues(selection) },
      { history: "replace" },
    );
  }

  function applyJobs(selection: HierarchicalFilterSelection) {
    void setQueryState(
      { jobs: toFilterValues(selection) },
      { history: "replace" },
    );
  }

  function changeParticipants(participantIds: string[]) {
    void setQueryState(
      { participant: participantIds.length > 0 ? participantIds : null },
      { history: "replace" },
    );
  }

  function changeTags(tagIds: string[]) {
    void setQueryState(
      { tags: tagIds.length > 0 ? tagIds : null },
      { history: "replace" },
    );
  }

  function changeDay(nextDay: number | null) {
    void setQueryState(
      { date: null, dateFrom: null, dateTo: null, day: nextDay },
      { history: "replace" },
    );
  }

  function changeDate(nextDate: string | null) {
    void setQueryState(
      { date: nextDate, dateFrom: null, dateTo: null, day: null },
      { history: "replace" },
    );
  }

  function changeDateRange(nextDateFrom: string | null, nextDateTo: string | null) {
    void setQueryState(
      {
        date: null,
        dateFrom: nextDateFrom,
        dateTo: nextDateTo,
        day: null,
      },
      { history: "replace" },
    );
  }

  function changeSort(nextSort: ClipSort) {
    void setQueryState(
      { sort: nextSort === "latest" ? null : nextSort },
      { history: "replace" },
    );
  }

  function changeView(nextView: ClipView) {
    void setQueryState(
      {
        view: nextView === "timeline" ? null : nextView,
      },
      { history: "replace" },
    );
  }

  function resetFilters() {
    void setQueryState(
      {
        q: null,
        groups: null,
        jobs: null,
        participant: null,
        tags: null,
        day: null,
        date: null,
        dateFrom: null,
        dateTo: null,
      },
      { history: "replace" },
    );
  }

  return {
    date,
    dateFrom,
    dateTo,
    day,
    filters: {
      date,
      dateFrom,
      dateTo,
      day,
      groups,
      jobs,
      participantIds: participant,
      tagIds: tags,
      query: q,
      sort,
    },
    groupSelection: { ids: groups },
    jobSelection: { ids: jobs },
    participantIds: participant,
    tagIds: tags,
    query: q,
    sort,
    view,
    applyGroups,
    applyJobs,
    changeDate,
    changeDateRange,
    changeDay,
    changeParticipants,
    changeTags,
    changeQuery,
    changeSort,
    changeView,
    resetFilters,
  };
}

function toFilterValues(
  selection: HierarchicalFilterSelection,
): string[] | null {
  const values = Array.from(
    new Set(selection.ids.map((id) => id.trim()).filter(Boolean)),
  );

  return values.length > 0 ? values : null;
}
