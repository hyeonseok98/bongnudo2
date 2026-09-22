"use client";

import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import {
  ARCHIVE_CATEGORY_VALUES, ARCHIVE_LIST_SORT_VALUES, ARCHIVE_STATUS_VALUES,
  type ArchiveCategory, type ArchiveListFilters, type ArchiveListSort, type ArchiveStatus,
} from "@/features/archives/archive";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

const archiveQueryParsers = {
  category: parseAsStringLiteral(ARCHIVE_CATEGORY_VALUES),
  participant: parseAsString,
  q: parseAsString.withDefault(""),
  sort: parseAsStringLiteral(ARCHIVE_LIST_SORT_VALUES),
  status: parseAsStringLiteral(ARCHIVE_STATUS_VALUES),
};

export function useArchiveDirectory() {
  const [{ category, participant, q, sort, status }, setQueryState] = useQueryStates(archiveQueryParsers);
  const debouncedQuery = useDebouncedValue(q, 300);
  const filters: ArchiveListFilters = {
    category, participantId: participant, query: participant ? "" : debouncedQuery.trim(),
    sort: sort ?? "updated", status, type: participant && !category && !status ? "all" : "user",
  };

  return {
    category, participantId: participant, query: filters.query, searchInput: q, sort, status, filters,
    hasFilters: Boolean(category || participant || q.trim() || status || sort),
    changeCategory: (value: ArchiveCategory | null) => void setQueryState({ category: value }),
    changeParticipant: (id: string | null) => void setQueryState({ participant: id, q: null }, { history: "push" }),
    changeSearchInput: (value: string) => void setQueryState({ q: value || null, participant: null }, { history: "replace" }),
    changeSort: (value: ArchiveListSort) => void setQueryState({ sort: value }),
    changeStatus: (value: ArchiveStatus | null) => void setQueryState({ status: value }),
    resetFilters: () => void setQueryState({ category: null, participant: null, q: null, sort: null, status: null }),
  };
}

export type ArchiveDirectory = ReturnType<typeof useArchiveDirectory>;
