import { queryOptions } from "@tanstack/react-query";

import { getLiveBroadcasts } from "@/apis/live/get-live-broadcasts";

export const liveQueries = {
  all: () => ["live"] as const,
  list: () =>
    queryOptions({
      queryKey: [...liveQueries.all(), "list"] as const,
      queryFn: getLiveBroadcasts,
      refetchInterval: 30_000,
    }),
};
