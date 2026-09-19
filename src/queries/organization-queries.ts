import { queryOptions } from "@tanstack/react-query";

import { getOrganizations } from "@/apis/organizations/get-organizations";

const METADATA_STALE_TIME = 5 * 60 * 1_000;

export const organizationQueries = {
  all: () => ["organizations"] as const,
  list: () =>
    queryOptions({
      queryKey: [...organizationQueries.all(), "list"] as const,
      queryFn: getOrganizations,
      staleTime: METADATA_STALE_TIME,
    }),
};
