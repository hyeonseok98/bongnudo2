import { queryOptions } from "@tanstack/react-query";

import { getLatestTimeline } from "@/apis/timeline/get-latest-timeline";
import { getTimeline } from "@/apis/timeline/get-timeline";
import type { TimelineQueryFilters } from "@/features/timeline/timeline";

export const timelineQueries = {
  all: () => ["timeline"] as const,
  lists: () => [...timelineQueries.all(), "list"] as const,
  homeLatest: () =>
    queryOptions({
      queryKey: [...timelineQueries.lists(), "home-latest"] as const,
      queryFn: getLatestTimeline,
    }),
  list: (filters: TimelineQueryFilters) =>
    queryOptions({
      queryKey: [...timelineQueries.lists(), filters] as const,
      queryFn: () => getTimeline(filters),
    }),
};
