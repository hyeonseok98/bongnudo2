"use client";

import { useEffect, useRef, useState } from "react";
import {
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";

import {
  ARCHIVE_CATEGORY_VALUES,
  ARCHIVE_STATUS_VALUES,
  type ArchiveCategory,
  type ArchiveListFilters,
  type ArchiveStatus,
} from "@/features/archives/archive";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

const archiveQueryParsers = {
  category: parseAsStringLiteral(ARCHIVE_CATEGORY_VALUES),
  participant: parseAsString,
  q: parseAsString.withDefault(""),
  status: parseAsStringLiteral(ARCHIVE_STATUS_VALUES),
};

export interface ArchiveDirectory {
  category: ArchiveCategory | null;
  filters: ArchiveListFilters;
  participantId: string | null;
  query: string;
  searchInput: string;
  status: ArchiveStatus | null;
  changeCategory: (category: ArchiveCategory | null) => void;
  changeParticipant: (participantId: string | null) => void;
  changeSearchInput: (query: string) => void;
  changeStatus: (status: ArchiveStatus | null) => void;
  resetFilters: () => void;
}

export function useArchiveDirectory(): ArchiveDirectory {
  const [{ category, participant, q, status }, setQueryState] = useQueryStates(
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

  function resetFilters() {
    lastSubmittedQuery.current = "";
    setSearchInput("");
    void setQueryState(
      {
        category: null,
        participant: null,
        q: null,
        status: null,
      },
      { history: "replace" },
    );
  }

  return {
    category,
    filters: {
      category,
      participantId: participant,
      query: q,
      sort: "updated",
      status,
      type: "user",
    },
    participantId: participant,
    query: q,
    searchInput,
    status,
    changeCategory,
    changeParticipant,
    changeSearchInput,
    changeStatus,
    resetFilters,
  };
}
