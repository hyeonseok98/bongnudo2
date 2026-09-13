import { queryOptions } from "@tanstack/react-query";

import { getTimeline } from "@/apis/timeline/get-timeline";
import type { TimelineQueryFilters } from "@/features/timeline/timeline";

export const timelineQueries = {
  all: () => ["timeline"] as const,
  lists: () => [...timelineQueries.all(), "list"] as const,
  list: (filters: TimelineQueryFilters) =>
    queryOptions({
      queryKey: [...timelineQueries.lists(), filters] as const,
      queryFn: () => getTimeline(filters),
    }),
};
