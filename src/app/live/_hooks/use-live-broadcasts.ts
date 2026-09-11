"use client";

import { useQuery } from "@tanstack/react-query";

import { liveQueries } from "@/queries/live-queries";

export function useLiveBroadcasts() {
  return useQuery(liveQueries.list());
}
