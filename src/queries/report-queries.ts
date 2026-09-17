import { queryOptions } from "@tanstack/react-query";

import { getReportOptions } from "@/apis/reports/get-report-options";
import { searchReportParticipants } from "@/apis/reports/search-report-participants";

export const reportQueries = {
  all: () => ["reports"] as const,
  options: () =>
    queryOptions({
      queryKey: [...reportQueries.all(), "options"] as const,
      queryFn: getReportOptions,
    }),
  participantSearch: (query: string) =>
    queryOptions({
      enabled: query.length > 0,
      queryKey: [...reportQueries.all(), "participant-search", query] as const,
      queryFn: () => searchReportParticipants(query),
    }),
};
