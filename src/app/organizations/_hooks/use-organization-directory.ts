"use client";

import { parseAsArrayOf, parseAsString, useQueryStates } from "nuqs";

import type { HierarchicalFilterSelection } from "@/components/filters/hierarchical-filter";

const organizationQueryParsers = {
  q: parseAsString.withDefault(""),
  institutions: parseAsArrayOf(parseAsString).withDefault([]),
};

export function useOrganizationDirectory() {
  const [{ q, institutions }, setQueryState] = useQueryStates(
    organizationQueryParsers,
  );
  const institutionSelection = { ids: institutions };

  function changeQuery(query: string) {
    void setQueryState({ q: query || null }, { history: "replace" });
  }

  function applyInstitutions(selection: HierarchicalFilterSelection) {
    void setQueryState(
      { institutions: selection.ids.length > 0 ? selection.ids : null },
      { history: "replace" },
    );
  }

  function removeInstitution(id: string) {
    applyInstitutions({
      ids: institutionSelection.ids.filter((selectedId) => selectedId !== id),
    });
  }

  function resetFilters() {
    void setQueryState(
      { q: null, institutions: null },
      { history: "replace" },
    );
  }

  return {
    q,
    institutionSelection,
    applyInstitutions,
    changeQuery,
    removeInstitution,
    resetFilters,
  };
}
