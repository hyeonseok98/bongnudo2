"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import type { MyArchiveTab } from "@/features/archives/archive";
import { archiveQueries } from "@/queries/archive-queries";

export function useMyArchives(tab: MyArchiveTab) {
  return useInfiniteQuery(archiveQueries.myList(tab));
}
