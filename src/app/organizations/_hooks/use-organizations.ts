"use client";

import { useQuery } from "@tanstack/react-query";

import { organizationQueries } from "@/queries/organization-queries";

export function useOrganizations() {
  return useQuery(organizationQueries.list());
}
