import type { CharacterAffiliationCategory } from "@/features/characters/character";

export const CHARACTER_AFFILIATION_CATEGORY_VALUES = [
  "all",
  "public-service",
  "business",
  "illegal-business",
  "gang",
  "crew",
] as const;

export type CharacterAffiliationCategoryFilter =
  (typeof CHARACTER_AFFILIATION_CATEGORY_VALUES)[number];

interface CharacterAffiliationCategoryOption {
  slug: CharacterAffiliationCategoryFilter;
  name: string;
}

export const CHARACTER_AFFILIATION_CATEGORIES = [
  { slug: "all", name: "전체" },
  { slug: "public-service", name: "공무직" },
  { slug: "business", name: "사업체" },
  { slug: "illegal-business", name: "불법사업체" },
  { slug: "gang", name: "갱단" },
  { slug: "crew", name: "크루" },
] satisfies readonly CharacterAffiliationCategoryOption[];

export const PUBLIC_SERVICE_AFFILIATION_ORDER = [
  "ems",
  "police",
  "transportation",
  "press",
  "city-hall",
] as const;

export function isCharacterAffiliationCategory(
  value: string,
): value is CharacterAffiliationCategory {
  return (
    value !== "all" &&
    CHARACTER_AFFILIATION_CATEGORY_VALUES.some(
      (category) => category === value,
    )
  );
}

export function isCharacterAffiliationCategoryFilter(
  value: string,
): value is CharacterAffiliationCategoryFilter {
  return CHARACTER_AFFILIATION_CATEGORY_VALUES.some(
    (category) => category === value,
  );
}
