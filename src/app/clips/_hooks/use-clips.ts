"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import type { ClipListFilters } from "@/features/clips/clip";
import { clipQueries } from "@/queries/clip-queries";

export function useClips(filters: ClipListFilters) {
  return useInfiniteQuery(clipQueries.list(filters));
}

export function useClipOptions() {
  return useQuery(clipQueries.options());
}
