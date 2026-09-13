import { queryOptions } from "@tanstack/react-query";

import { getOrganizations } from "@/apis/organizations/get-organizations";

export const organizationQueries = {
  all: () => ["organizations"] as const,
  list: () =>
    queryOptions({
      queryKey: [...organizationQueries.all(), "list"] as const,
      queryFn: getOrganizations,
    }),
};
