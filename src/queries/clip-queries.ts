import {
  infiniteQueryOptions,
  queryOptions,
  type InfiniteData,
} from "@tanstack/react-query";

import { getClipOptions, getClips } from "@/apis/clips/get-clips";
import type {
  ClipCursor,
  ClipListFilters,
  ClipPage,
} from "@/features/clips/clip";

export const clipQueries = {
  all: () => ["clips"] as const,
  options: () =>
    queryOptions({
      queryKey: [...clipQueries.all(), "options"] as const,
      queryFn: getClipOptions,
    }),
  list: (filters: ClipListFilters) =>
    infiniteQueryOptions<
      ClipPage,
      Error,
      InfiniteData<ClipPage, ClipCursor | null>,
      readonly ["clips", "list", ClipListFilters],
      ClipCursor | null
    >({
      queryKey: [...clipQueries.all(), "list", filters] as const,
      queryFn: ({ pageParam }) => getClips(filters, pageParam),
      initialPageParam: null,
      getNextPageParam: (page) => page.nextCursor,
    }),
};
