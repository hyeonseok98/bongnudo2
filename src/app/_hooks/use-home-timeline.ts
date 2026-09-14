"use client";

import { useQuery } from "@tanstack/react-query";

import { timelineQueries } from "@/queries/timeline-queries";

export function useHomeTimeline() {
  return useQuery(timelineQueries.homeLatest());
}
