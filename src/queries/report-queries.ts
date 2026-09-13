import { queryOptions } from "@tanstack/react-query";

import { getTimelineReportCategories } from "@/apis/reports/get-report-categories";
import { getReportParticipants } from "@/apis/reports/search-report-participants";

export const reportQueries = {
  all: () => ["reports"] as const,
  categories: () =>
    queryOptions({
      queryKey: [...reportQueries.all(), "categories"] as const,
      queryFn: getTimelineReportCategories,
    }),
  participants: () => [...reportQueries.all(), "participants"] as const,
  participantSearch: (query: string) =>
    queryOptions({
      queryKey: [...reportQueries.participants(), "search", query] as const,
      queryFn: () => getReportParticipants(query),
      enabled: query.trim().length > 0,
    }),
};
