"use client";

import { useEffect, useRef, useState } from "react";
import {
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";

import {
  ARCHIVE_CATEGORY_VALUES,
  ARCHIVE_LIST_SORT_VALUES,
  ARCHIVE_LIST_TYPE_VALUES,
  ARCHIVE_STATUS_VALUES,
  type ArchiveCategory,
  type ArchiveListFilters,
  type ArchiveListSort,
  type ArchiveListType,
  type ArchiveStatus,
} from "@/features/archives/archive";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

const archiveQueryParsers = {
  category: parseAsStringLiteral(ARCHIVE_CATEGORY_VALUES),
  participant: parseAsString,
  q: parseAsString.withDefault(""),
  sort: parseAsStringLiteral(ARCHIVE_LIST_SORT_VALUES).withDefault("updated"),
  status: parseAsStringLiteral(ARCHIVE_STATUS_VALUES),
  type: parseAsStringLiteral(ARCHIVE_LIST_TYPE_VALUES).withDefault("all"),
};

export interface ArchiveDirectory {
  category: ArchiveCategory | null;
  filters: ArchiveListFilters;
  participantId: string | null;
  query: string;
  searchInput: string;
  sort: ArchiveListSort;
  status: ArchiveStatus | null;
  type: ArchiveListType;
  changeCategory: (category: ArchiveCategory | null) => void;
  changeParticipant: (participantId: string | null) => void;
  changeSearchInput: (query: string) => void;
  changeSort: (sort: ArchiveListSort) => void;
  changeStatus: (status: ArchiveStatus | null) => void;
  changeType: (type: ArchiveListType) => void;
  resetFilters: () => void;
}

export function useArchiveDirectory(): ArchiveDirectory {
  const [{ category, participant, q, sort, status, type }, setQueryState] = useQueryStates(
    archiveQueryParsers,
  );
  const [searchInput, setSearchInput] = useState(q);
  const debouncedSearchInput = useDebouncedValue(searchInput, 300);
  const lastSubmittedQuery = useRef(q);

  useEffect(() => {
    if (debouncedSearchInput === lastSubmittedQuery.current) {
      return;
    }

    lastSubmittedQuery.current = debouncedSearchInput;
    void setQueryState({ q: debouncedSearchInput || null }, { history: "replace" });
  }, [debouncedSearchInput, setQueryState]);

  useEffect(() => {
    if (q === lastSubmittedQuery.current) {
      return;
    }

    lastSubmittedQuery.current = q;
    setSearchInput(q);
  }, [q]);

  function changeType(nextType: ArchiveListType) {
    void setQueryState(
      {
        category: nextType === "user" ? undefined : null,
        status: nextType === "user" ? undefined : null,
        type: nextType === "all" ? null : nextType,
      },
      { history: "replace" },
    );
  }

  function changeSearchInput(nextQuery: string) {
    setSearchInput(nextQuery);
  }

  function changeParticipant(participantId: string | null) {
    void setQueryState({ participant: participantId }, { history: "replace" });
  }

  function changeCategory(nextCategory: ArchiveCategory | null) {
    void setQueryState({ category: nextCategory }, { history: "replace" });
  }

  function changeStatus(nextStatus: ArchiveStatus | null) {
    void setQueryState({ status: nextStatus }, { history: "replace" });
  }

  function changeSort(nextSort: ArchiveListSort) {
    void setQueryState(
      { sort: nextSort === "updated" ? null : nextSort },
      { history: "replace" },
    );
  }

  function resetFilters() {
    lastSubmittedQuery.current = "";
    setSearchInput("");
    void setQueryState(
      {
        category: null,
        participant: null,
        q: null,
        status: null,
        type: null,
      },
      { history: "replace" },
    );
  }

  return {
    category: type === "user" ? category : null,
    filters: {
      category: type === "user" ? category : null,
      participantId: participant,
      query: q,
      sort,
      status: type === "user" ? status : null,
      type,
    },
    participantId: participant,
    query: q,
    searchInput,
    sort,
    status: type === "user" ? status : null,
    type,
    changeCategory,
    changeParticipant,
    changeSearchInput,
    changeSort,
    changeStatus,
    changeType,
    resetFilters,
  };
}
