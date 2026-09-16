"use client";

import {
  parseAsInteger,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";

import { CLIP_SORT_VALUES, type ClipSort } from "@/features/clips/clip";

interface SystemArchiveDirectory {
  day: number | null;
  sort: ClipSort;
  changeDay: (day: number | null) => void;
  changeSort: (sort: ClipSort) => void;
}

const systemArchiveParsers = {
  day: parseAsInteger,
  sort: parseAsStringLiteral(CLIP_SORT_VALUES).withDefault("oldest"),
};

export function useSystemArchiveDirectory(): SystemArchiveDirectory {
  const [{ day, sort }, setQueryState] = useQueryStates(systemArchiveParsers);

  function changeDay(nextDay: number | null) {
    void setQueryState({ day: nextDay }, { history: "replace" });
  }

  function changeSort(nextSort: ClipSort) {
    void setQueryState({ sort: nextSort }, { history: "replace" });
  }

  return { day, sort, changeDay, changeSort };
}
