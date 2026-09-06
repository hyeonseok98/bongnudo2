import {
  PUBLIC_SERVICE_AFFILIATION_ORDER,
  isCharacterAffiliationCategory,
  type CharacterAffiliationCategoryFilter,
} from "@/constants/character-affiliations";
import type { CharacterSort } from "@/constants/character-list";
import type {
  CharacterAffiliation,
  CharacterListItem,
} from "@/features/characters/character";

interface CharacterFilterCriteria {
  query: string;
  affiliationType: CharacterAffiliationCategoryFilter;
  affiliationSlug: string | null;
  selectedGroupIds: string[];
}

export function getAvailableAffiliations(
  characters: CharacterListItem[],
  affiliationType: CharacterAffiliationCategoryFilter,
): CharacterAffiliation[] {
  if (!isCharacterAffiliationCategory(affiliationType)) {
    return [];
  }

  const affiliationsBySlug = new Map<string, CharacterAffiliation>();

  for (const character of characters) {
    for (const affiliation of character.affiliations) {
      if (
        affiliation.category === affiliationType &&
        !affiliationsBySlug.has(affiliation.slug)
      ) {
        affiliationsBySlug.set(affiliation.slug, affiliation);
      }
    }
  }

  return Array.from(affiliationsBySlug.values()).sort((left, right) => {
    if (affiliationType === "public-service") {
      const leftOrder = getPublicServiceOrder(left.slug);
      const rightOrder = getPublicServiceOrder(right.slug);

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }
    }

    return left.name.localeCompare(right.name, "ko-KR");
  });
}

export function filterCharacters(
  characters: CharacterListItem[],
  criteria: CharacterFilterCriteria,
): CharacterListItem[] {
  const normalizedQuery = criteria.query.trim().toLocaleLowerCase("ko-KR");

  return characters.filter((character) => {
    const searchableText = [character.streamerName, character.rpName]
      .filter((value) => value !== null)
      .join(" ")
      .toLocaleLowerCase("ko-KR");
    const isQueryMatched =
      normalizedQuery.length === 0 || searchableText.includes(normalizedQuery);
    const isGroupMatched =
      criteria.selectedGroupIds.length === 0 ||
      (character.group !== null &&
        criteria.selectedGroupIds.includes(character.group.slug));
    const isAffiliationTypeMatched =
      criteria.affiliationType === "all" ||
      character.affiliations.some(
        (affiliation) =>
          affiliation.category === criteria.affiliationType,
      );
    const isAffiliationMatched =
      criteria.affiliationSlug === null ||
      character.affiliations.some(
        (affiliation) =>
          affiliation.slug === criteria.affiliationSlug,
      );

    return (
      isQueryMatched &&
      isGroupMatched &&
      isAffiliationTypeMatched &&
      isAffiliationMatched
    );
  });
}

export function sortCharacters(
  characters: CharacterListItem[],
  sort: CharacterSort,
): CharacterListItem[] {
  const direction = sort === "asc" ? 1 : -1;

  return [...characters].sort(
    (left, right) =>
      left.streamerName.localeCompare(right.streamerName, "ko-KR") * direction,
  );
}

function getPublicServiceOrder(slug: string): number {
  const order = PUBLIC_SERVICE_AFFILIATION_ORDER.findIndex(
    (affiliationSlug) => affiliationSlug === slug,
  );

  return order === -1 ? PUBLIC_SERVICE_AFFILIATION_ORDER.length : order;
}
