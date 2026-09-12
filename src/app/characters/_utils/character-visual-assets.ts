import { PUBLIC_SERVICE_AFFILIATION_ORDER } from "@/constants/character-affiliations";
import {
  getOrderedAffiliations,
  type CharacterListItem,
} from "@/features/characters/character";

export type CharacterVisualTheme = "dark" | "light";

export interface CharacterAffiliationDetailAssets {
  heroSrc: string;
  cardBackgroundSrc: string;
}

interface AffiliationVisualAssetParams {
  category: string;
  slug: string;
  theme: CharacterVisualTheme;
}

const CATEGORY_VISUAL_SLUGS = [
  "business",
  "citizen",
  "crew",
  "gang",
  "illegal-business",
] as const;

export function getCharactersHeroBanner(theme: CharacterVisualTheme) {
  return `/banner/city_${theme}.webp`;
}

export function getCharacterAffiliationDetailAssets(
  character: CharacterListItem,
  theme: CharacterVisualTheme,
): CharacterAffiliationDetailAssets {
  const affiliation = getOrderedAffiliations(character.affiliations)[0];

  if (!affiliation) {
    return getDefaultDetailAssets(theme);
  }

  return getAffiliationVisualAssets({
    category: affiliation.category,
    slug: affiliation.slug,
    theme,
  });
}

export function getAffiliationVisualAssets({
  category,
  slug,
  theme,
}: AffiliationVisualAssetParams): CharacterAffiliationDetailAssets {
  if (isOrganizationVisualSlug(slug) && category === "public-service") {
    return {
      heroSrc: `/images/affiliations/organizations/${slug}_${theme}.webp`,
      cardBackgroundSrc: `/images/affiliations/organizations/detail-background/${slug}_bg_${theme}.webp`,
    };
  }

  if (isCategoryVisualSlug(category)) {
    return {
      heroSrc: `/images/affiliations/categories/${category}_${theme}.webp`,
      cardBackgroundSrc: getCategoryCardBackgroundSrc(category, theme),
    };
  }

  return getDefaultDetailAssets(theme);
}

function getCategoryCardBackgroundSrc(
  slug: (typeof CATEGORY_VISUAL_SLUGS)[number],
  theme: CharacterVisualTheme,
) {
  if (slug === "illegal-business" && theme === "dark") {
    return "/images/affiliations/categories/detail-background/illegal-business_dark.webp";
  }

  return `/images/affiliations/categories/detail-background/${slug}_bg_${theme}.webp`;
}

function getDefaultDetailAssets(
  theme: CharacterVisualTheme,
): CharacterAffiliationDetailAssets {
  return {
    heroSrc: `/images/affiliations/organizations/city-hall_${theme}.webp`,
    cardBackgroundSrc: `/images/affiliations/organizations/detail-background/city-hall_bg_${theme}.webp`,
  };
}

function isOrganizationVisualSlug(
  slug: string,
): slug is (typeof PUBLIC_SERVICE_AFFILIATION_ORDER)[number] {
  return PUBLIC_SERVICE_AFFILIATION_ORDER.some(
    (organizationSlug) => organizationSlug === slug,
  );
}

function isCategoryVisualSlug(
  slug: string,
): slug is (typeof CATEGORY_VISUAL_SLUGS)[number] {
  return CATEGORY_VISUAL_SLUGS.some(
    (categorySlug) => categorySlug === slug,
  );
}
