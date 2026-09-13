import { queryOptions } from "@tanstack/react-query";

import { getReportParticipants } from "@/apis/reports/search-report-participants";

export const reportQueries = {
  all: () => ["reports"] as const,
  participants: () => [...reportQueries.all(), "participants"] as const,
  participantSearch: (query: string) =>
    queryOptions({
      queryKey: [...reportQueries.participants(), "search", query] as const,
      queryFn: () => getReportParticipants(query),
      enabled: query.trim().length > 0,
    }),
};
