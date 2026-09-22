import {
  infiniteQueryOptions,
  keepPreviousData,
  queryOptions,
  type InfiniteData,
} from "@tanstack/react-query";

import { getReplayOptions, getReplays } from "@/apis/replays/get-replays";
import type { ReplayCursor, ReplayListFilters, ReplayPage } from "@/features/replays/replay";

const METADATA_STALE_TIME = 5 * 60 * 1_000;

export const replayQueries = {
  all: () => ["replays"] as const,
  lists: () => [...replayQueries.all(), "list"] as const,
  options: () => queryOptions({
    queryKey: [...replayQueries.all(), "options"] as const,
    queryFn: getReplayOptions,
    staleTime: METADATA_STALE_TIME,
  }),
  list: (filters: ReplayListFilters) =>
    infiniteQueryOptions<
      ReplayPage,
      Error,
      InfiniteData<ReplayPage, ReplayCursor | null>,
      readonly ["replays", "list", ReplayListFilters],
      ReplayCursor | null
    >({
      queryKey: [...replayQueries.lists(), filters] as const,
      queryFn: ({ pageParam }) => getReplays(filters, pageParam),
      placeholderData: keepPreviousData,
      initialPageParam: null,
      getNextPageParam: (page) => page.nextCursor,
    }),
};
