import { queryOptions } from "@tanstack/react-query";

import { getLiveBroadcasts } from "@/apis/live/get-live-broadcasts";
import { getSurgingLiveBroadcasts } from "@/apis/live/get-surging-live-broadcasts";

export const liveQueries = {
  all: () => ["live"] as const,
  list: () =>
    queryOptions({
      queryKey: [...liveQueries.all(), "list"] as const,
      queryFn: getLiveBroadcasts,
      refetchInterval: 30_000,
    }),
  surging: () =>
    queryOptions({
      queryKey: [...liveQueries.all(), "surging"] as const,
      queryFn: getSurgingLiveBroadcasts,
      refetchInterval: 30_000,
      staleTime: 20_000,
    }),
};
