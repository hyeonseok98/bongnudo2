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
  "jobs",
  "affiliationType",
  "affiliation",
  "groups",
  "sort",
  "view",
];

export interface CharacterPreferences {
  jobs: string[];
  groups: string[];
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

    const { groups, jobs, sort, view } = value;

    if (
      !isStringArray(groups) ||
      typeof sort !== "string" ||
      !isCharacterSort(sort) ||
      typeof view !== "string" ||
      !isCharacterView(view)
    ) {
      return null;
    }

    return {
      jobs: isStringArray(jobs)
        ? normalizeFilterIds(jobs)
        : getLegacyPreferenceJobs(value),
      groups: normalizeFilterIds(groups),
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

export function normalizeFilterIds(ids: string[]): string[] {
  return Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
}

export function getStreamerAffiliationSelection(
  groups: string[],
): HierarchicalFilterSelection {
  return { ids: normalizeFilterIds(groups) };
}

export function getFilterQueryValue(
  selection: HierarchicalFilterSelection,
): string[] | null {
  const ids = normalizeFilterIds(selection.ids);

  return ids.length > 0 ? ids : null;
}

export function getLegacyJobSelection(
  jobs: string[],
  affiliationType: CharacterAffiliationCategoryFilter,
  affiliation: string,
): HierarchicalFilterSelection {
  const normalizedJobs = normalizeFilterIds(jobs);

  if (normalizedJobs.length > 0) {
    return { ids: normalizedJobs };
  }

  if (affiliation) {
    return { ids: [affiliation] };
  }

  return affiliationType === "all" ? { ids: [] } : { ids: [affiliationType] };
}

function getLegacyPreferenceJobs(value: Record<string, unknown>): string[] {
  const { affiliation, affiliationType } = value;

  if (
    typeof affiliationType !== "string" ||
    !isCharacterAffiliationCategoryFilter(affiliationType) ||
    !(typeof affiliation === "string" || affiliation === null)
  ) {
    return [];
  }

  return getLegacyJobSelection([], affiliationType, affiliation ?? "").ids;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}
