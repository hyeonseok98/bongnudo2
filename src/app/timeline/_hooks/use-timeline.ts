"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { TimelineQueryFilters } from "@/features/timeline/timeline";
import { timelineQueries } from "@/queries/timeline-queries";

export function useTimeline(filters: TimelineQueryFilters) {
  return useQuery({
    ...timelineQueries.list(filters),
    placeholderData: keepPreviousData,
  });
}
