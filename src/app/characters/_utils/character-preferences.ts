import {
  isCharacterAffiliationCategoryFilter,
  type CharacterAffiliationCategoryFilter,
} from "@/constants/character-affiliations";
import { isCharacterGroupSlug } from "@/constants/character-groups";
import {
  isCharacterSort,
  isCharacterView,
  type CharacterSort,
  type CharacterView,
} from "@/constants/character-list";

const CHARACTER_PREFERENCES_KEY = "bongnudo2:characters:preferences";
const CHARACTER_PREFERENCE_QUERY_KEYS = [
  "q",
  "affiliationType",
  "affiliation",
  "groups",
  "sort",
  "view",
];

export interface CharacterPreferences {
  affiliationType: CharacterAffiliationCategoryFilter;
  affiliation: string | null;
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

    const { affiliationType, affiliation, groups, sort, view } = value;

    if (
      typeof affiliationType !== "string" ||
      !isCharacterAffiliationCategoryFilter(affiliationType) ||
      !(typeof affiliation === "string" || affiliation === null) ||
      !isStringArray(groups) ||
      typeof sort !== "string" ||
      !isCharacterSort(sort) ||
      typeof view !== "string" ||
      !isCharacterView(view)
    ) {
      return null;
    }

    return {
      affiliationType,
      affiliation: affiliationType === "all" ? null : affiliation,
      groups: normalizeGroupIds(groups),
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
    new Set(groupIds.filter((groupId) => isCharacterGroupSlug(groupId))),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}
