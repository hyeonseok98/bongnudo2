"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import type { ReplayListFilters } from "@/features/replays/replay";
import { replayQueries } from "@/queries/replay-queries";

export function useReplays(filters: ReplayListFilters) {
  return useInfiniteQuery(replayQueries.list(filters));
}

export function useReplayOptions() {
  return useQuery(replayQueries.options());
}
