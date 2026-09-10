import {
  isCharacterAffiliationCategoryFilter,
  type CharacterAffiliationCategoryFilter,
} from "@/constants/character-affiliations";
import {
  isCharacterSort,
  isCharacterView,
  type CharacterSort,
  type CharacterView,
} from "@/constants/character-list";
import type { HierarchicalFilterSelection } from "@/components/filters/hierarchical-filter";

const CHARACTER_PREFERENCES_KEY = "bongnudo2:characters:preferences";
const CHARACTER_PREFERENCE_QUERY_KEYS = [
  "q",
  "affiliationType",
  "affiliation",
  "groups",
  "excludeGroups",
  "sort",
  "view",
];

export interface CharacterPreferences {
  affiliationType: CharacterAffiliationCategoryFilter;
  affiliation: string | null;
  groups: string[];
  excludeGroups: string[];
  sort: CharacterSort;
  view: CharacterView;
}

export function hasExplicitCharacterPreferences(search: string): boolean {
  const searchParams = new URLSearchParams(search);

  return CHARACTER_PREFERENCE_QUERY_KEYS.some((key) =>
    searchParams.has(key),
  );
}

export function readCharacterPreferences(): CharacterPreferences | null {
  const storedPreferences = window.localStorage.getItem(
    CHARACTER_PREFERENCES_KEY,
  );

  if (!storedPreferences) {
    return null;
  }

  try {
    const value: unknown = JSON.parse(storedPreferences);

    if (!isRecord(value)) {
      return null;
    }

    const {
      affiliationType,
      affiliation,
      groups,
      excludeGroups,
      sort,
      view,
    } = value;
    const storedExcludeGroups = excludeGroups ?? [];

    if (
      typeof affiliationType !== "string" ||
      !isCharacterAffiliationCategoryFilter(affiliationType) ||
      !(typeof affiliation === "string" || affiliation === null) ||
      !isStringArray(groups) ||
      !isStringArray(storedExcludeGroups) ||
      typeof sort !== "string" ||
      !isCharacterSort(sort) ||
      typeof view !== "string" ||
      !isCharacterView(view)
    ) {
      return null;
    }

    const streamerAffiliationSelection = getStreamerAffiliationSelection(
      groups,
      storedExcludeGroups,
    );

    return {
      affiliationType,
      affiliation: affiliationType === "all" ? null : affiliation,
      groups:
        streamerAffiliationSelection.mode === "include"
          ? streamerAffiliationSelection.ids
          : [],
      excludeGroups:
        streamerAffiliationSelection.mode === "exclude"
          ? streamerAffiliationSelection.ids
          : [],
      sort,
      view,
    };
  } catch {
    return null;
  }
}

export function writeCharacterPreferences(
  preferences: CharacterPreferences,
) {
  window.localStorage.setItem(
    CHARACTER_PREFERENCES_KEY,
    JSON.stringify(preferences),
  );
}

export function normalizeGroupIds(groupIds: string[]): string[] {
  return Array.from(
    new Set(groupIds.map((groupId) => groupId.trim()).filter(Boolean)),
  );
}

export function getStreamerAffiliationSelection(
  groups: string[],
  excludeGroups: string[],
): HierarchicalFilterSelection {
  const normalizedGroups = normalizeGroupIds(groups);

  if (normalizedGroups.length > 0) {
    return { mode: "include", ids: normalizedGroups };
  }

  const normalizedExcludeGroups = normalizeGroupIds(excludeGroups);

  return normalizedExcludeGroups.length > 0
    ? { mode: "exclude", ids: normalizedExcludeGroups }
    : { mode: "include", ids: [] };
}

export function getStreamerAffiliationQueryState(
  selection: HierarchicalFilterSelection,
): {
  groups: string[] | null;
  excludeGroups: string[] | null;
} {
  const ids = normalizeGroupIds(selection.ids);

  if (selection.mode === "exclude" && ids.length > 0) {
    return { groups: null, excludeGroups: ids };
  }

  return {
    groups: ids.length > 0 ? ids : null,
    excludeGroups: null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}
