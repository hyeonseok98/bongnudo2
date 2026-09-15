import { queryOptions } from "@tanstack/react-query";

import { getLatestTimeline } from "@/apis/timeline/get-latest-timeline";
import { getClipThumbnail } from "@/apis/timeline/get-clip-thumbnail";
import { getTimeline } from "@/apis/timeline/get-timeline";
import type { TimelineQueryFilters } from "@/features/timeline/timeline";

export const timelineQueries = {
  all: () => ["timeline"] as const,
  lists: () => [...timelineQueries.all(), "list"] as const,
  clipThumbnails: () => [...timelineQueries.all(), "clip-thumbnail"] as const,
  clipThumbnail: (clipUrl: string) =>
    queryOptions({
      queryKey: [...timelineQueries.clipThumbnails(), clipUrl] as const,
      queryFn: () => getClipThumbnail(clipUrl),
      staleTime: 24 * 60 * 60 * 1_000,
    }),
  homeLatest: () =>
    queryOptions({
      queryKey: [...timelineQueries.lists(), "home-latest"] as const,
      queryFn: getLatestTimeline,
    }),
  list: (filters: TimelineQueryFilters) =>
    queryOptions({
      queryKey: [...timelineQueries.lists(), filters] as const,
      queryFn: () => getTimeline(filters),
      staleTime: 60 * 1_000,
    }),
};
