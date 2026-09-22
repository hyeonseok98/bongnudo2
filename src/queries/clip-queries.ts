import {
  infiniteQueryOptions,
  keepPreviousData,
  queryOptions,
  type InfiniteData,
} from "@tanstack/react-query";

import { getClipOptions, getClips } from "@/apis/clips/get-clips";
import type {
  ClipCursor,
  ClipListFilters,
  ClipPage,
} from "@/features/clips/clip";

const METADATA_STALE_TIME = 5 * 60 * 1_000;

export const clipQueries = {
  all: () => ["clips"] as const,
  lists: () => [...clipQueries.all(), "list"] as const,
  options: () =>
    queryOptions({
      queryKey: [...clipQueries.all(), "options"] as const,
      queryFn: getClipOptions,
      staleTime: METADATA_STALE_TIME,
    }),
  list: (filters: ClipListFilters) =>
    infiniteQueryOptions<
      ClipPage,
      Error,
      InfiniteData<ClipPage, ClipCursor | null>,
      readonly ["clips", "list", ClipListFilters],
      ClipCursor | null
    >({
      queryKey: [...clipQueries.lists(), filters] as const,
      queryFn: ({ pageParam }) => getClips(filters, pageParam),
      placeholderData: keepPreviousData,
      initialPageParam: null,
      getNextPageParam: (page) => page.nextCursor,
    }),
};
