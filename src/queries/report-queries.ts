import { queryOptions } from "@tanstack/react-query";

import { getReportOptions } from "@/apis/reports/get-report-options";

export const reportQueries = {
  all: () => ["reports"] as const,
  options: () =>
    queryOptions({
      queryKey: [...reportQueries.all(), "options"] as const,
      queryFn: getReportOptions,
    }),
};
