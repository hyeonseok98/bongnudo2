import { infiniteQueryOptions, queryOptions, type InfiniteData } from "@tanstack/react-query";

import { getReplayOptions, getReplays } from "@/apis/replays/get-replays";
import type { ReplayCursor, ReplayListFilters, ReplayPage } from "@/features/replays/replay";

export const replayQueries = {
  all: () => ["replays"] as const,
  options: () => queryOptions({
    queryKey: [...replayQueries.all(), "options"] as const,
    queryFn: getReplayOptions,
  }),
  list: (filters: ReplayListFilters) =>
    infiniteQueryOptions<
      ReplayPage,
      Error,
      InfiniteData<ReplayPage, ReplayCursor | null>,
      readonly ["replays", "list", ReplayListFilters],
      ReplayCursor | null
    >({
      queryKey: [...replayQueries.all(), "list", filters] as const,
      queryFn: ({ pageParam }) => getReplays(filters, pageParam),
      initialPageParam: null,
      getNextPageParam: (page) => page.nextCursor,
    }),
};
