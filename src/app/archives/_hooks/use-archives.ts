"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import type { ArchiveListFilters } from "@/features/archives/archive";
import { archiveQueries } from "@/queries/archive-queries";

export function useArchives(filters: ArchiveListFilters, isEnabled = true) {
  return useInfiniteQuery({ ...archiveQueries.list(filters), enabled: isEnabled });
}
