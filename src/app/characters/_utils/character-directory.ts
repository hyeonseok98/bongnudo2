import {
  CHARACTER_AFFILIATION_CATEGORIES,
  PUBLIC_SERVICE_AFFILIATION_ORDER,
  isCharacterAffiliationCategory,
  type CharacterAffiliationCategoryFilter,
} from "@/constants/character-affiliations";
import type { CharacterSort } from "@/constants/character-list";
import type {
  FilterTreeNode,
  HierarchicalFilterSelection,
  QuickFilterOption,
} from "@/components/filters/hierarchical-filter";
import type {
  CharacterAffiliation,
  CharacterListItem,
  StreamerAffiliation,
} from "@/features/characters/character";

export interface CharacterFilterCriteria {
  query: string;
  jobSelection: HierarchicalFilterSelection;
  streamerAffiliationSelection: HierarchicalFilterSelection;
}

export interface CharacterFilterFacetData {
  jobNodes: FilterTreeNode[];
  streamerAffiliations: StreamerAffiliationFilterData;
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

export interface StreamerAffiliationFilterData {
  nodes: FilterTreeNode[];
  quickOptions: QuickFilterOption[];
}

export function buildJobAffiliationFilterNodes(
  characters: CharacterListItem[],
): FilterTreeNode[] {
  return CHARACTER_AFFILIATION_CATEGORIES.flatMap((category) => {
    if (!isCharacterAffiliationCategory(category.slug)) {
      return [];
    }

    const categoryCharacters = characters.filter((character) =>
      character.affiliations.some(
        (affiliation) => affiliation.category === category.slug,
      ),
    );

    const children = getAvailableAffiliations(
      categoryCharacters,
      category.slug,
    ).flatMap((affiliation) => {
      const count = categoryCharacters.filter((character) =>
        character.affiliations.some(
          (candidate) =>
            candidate.category === category.slug &&
            candidate.slug === affiliation.slug,
        ),
      ).length;

      return count > 0
        ? [{ id: affiliation.slug, label: affiliation.name, count }]
        : [];
    });

    return [
      {
        id: category.slug,
        label: category.name,
        count: categoryCharacters.length,
        disabled: categoryCharacters.length === 0,
        children,
      },
    ];
  });
}

export function buildStreamerAffiliationFilterData(
  characters: CharacterListItem[],
  affiliations: StreamerAffiliation[],
): StreamerAffiliationFilterData {
  const characterIdsByAffiliationId = new Map<string, Set<string>>();

  for (const character of characters) {
    for (const affiliation of character.streamerAffiliations) {
      const characterIds =
        characterIdsByAffiliationId.get(affiliation.id) ?? new Set<string>();
      characterIds.add(character.id);
      characterIdsByAffiliationId.set(affiliation.id, characterIds);
    }
  }

  const visibleAffiliations = affiliations
    .filter((affiliation) => affiliation.isFilterVisible)
    .sort(compareStreamerAffiliations);
  const visibleIds = new Set(
    visibleAffiliations.map((affiliation) => affiliation.id),
  );
  const childrenByParentId = new Map<string, StreamerAffiliation[]>();

  for (const affiliation of visibleAffiliations) {
    if (
      affiliation.parentAffiliationId &&
      visibleIds.has(affiliation.parentAffiliationId)
    ) {
      const children =
        childrenByParentId.get(affiliation.parentAffiliationId) ?? [];
      children.push(affiliation);
      childrenByParentId.set(affiliation.parentAffiliationId, children);
    }
  }

  const nodes = visibleAffiliations
    .filter(
      (affiliation) =>
        affiliation.parentAffiliationId === null ||
        !visibleIds.has(affiliation.parentAffiliationId),
    )
    .flatMap((affiliation) => {
      const count = characterIdsByAffiliationId.get(affiliation.id)?.size ?? 0;
      const children = (childrenByParentId.get(affiliation.id) ?? []).flatMap(
        (child) => {
          const childCount =
            characterIdsByAffiliationId.get(child.id)?.size ?? 0;

          return childCount > 0
            ? [{ id: child.slug, label: child.name, count: childCount }]
            : [];
        },
      );

      return count > 0 || children.length > 0
        ? [{ id: affiliation.slug, label: affiliation.name, count, children }]
        : [];
    });

  const quickOptions = visibleAffiliations
    .filter(
      (affiliation) =>
        affiliation.isQuickFilter &&
        (characterIdsByAffiliationId.get(affiliation.id)?.size ?? 0) > 0,
    )
    .map((affiliation) => ({
      id: affiliation.slug,
      label: affiliation.quickFilterLabel ?? affiliation.name,
    }));

  return { nodes, quickOptions };
}

export function buildCharacterFilterFacetData(
  characters: CharacterListItem[],
  streamerAffiliations: StreamerAffiliation[],
  criteria: CharacterFilterCriteria,
): CharacterFilterFacetData {
  const jobFacetCharacters = filterCharacters(
    characters,
    {
      ...criteria,
      jobSelection: { ids: [] },
    },
    streamerAffiliations,
  );
  const streamerAffiliationFacetCharacters = filterCharacters(
    characters,
    {
      ...criteria,
      streamerAffiliationSelection: { ids: [] },
    },
    streamerAffiliations,
  );

  return {
    jobNodes: buildJobAffiliationFilterNodes(jobFacetCharacters),
    streamerAffiliations: buildStreamerAffiliationFilterData(
      streamerAffiliationFacetCharacters,
      streamerAffiliations,
    ),
  };
}

export function getStreamerAffiliationFilterLabel(
  affiliations: StreamerAffiliation[],
  affiliationSlug: string,
): string | null {
  const affiliation = affiliations.find(
    (candidate) => candidate.slug === affiliationSlug,
  );

  if (!affiliation) {
    return null;
  }

  const parent = affiliation.parentAffiliationId
    ? affiliations.find(
        (candidate) => candidate.id === affiliation.parentAffiliationId,
      )
    : null;

  return parent ? parent.name + " > " + affiliation.name : affiliation.name;
}

function compareStreamerAffiliations(
  left: StreamerAffiliation,
  right: StreamerAffiliation,
): number {
  return (
    (left.filterOrder ?? Number.MAX_SAFE_INTEGER) -
      (right.filterOrder ?? Number.MAX_SAFE_INTEGER) ||
    left.name.localeCompare(right.name, "ko-KR")
  );
}

export function filterCharacters(
  characters: CharacterListItem[],
  criteria: CharacterFilterCriteria,
  streamerAffiliations: StreamerAffiliation[] = [],
): CharacterListItem[] {
  const normalizedQuery = criteria.query.trim().toLocaleLowerCase("ko-KR");
  const selectedJobIds = new Set(criteria.jobSelection.ids);
  const selectedStreamerAffiliationIds = getSelectedStreamerAffiliationSlugs(
    streamerAffiliations,
    criteria.streamerAffiliationSelection.ids,
  );

  return characters.filter((character) => {
    const searchableText = [character.streamerName, character.rpName]
      .filter((value) => value !== null)
      .join(" ")
      .toLocaleLowerCase("ko-KR");
    const isQueryMatched =
      normalizedQuery.length === 0 || searchableText.includes(normalizedQuery);
    const hasSelectedStreamerAffiliation =
      character.streamerAffiliations.some((affiliation) =>
        selectedStreamerAffiliationIds.has(affiliation.slug),
      );
    const isStreamerAffiliationMatched =
      selectedStreamerAffiliationIds.size === 0 ||
      hasSelectedStreamerAffiliation;
    const isJobMatched =
      selectedJobIds.size === 0 ||
      character.affiliations.some(
        (affiliation) =>
          selectedJobIds.has(affiliation.category) ||
          selectedJobIds.has(affiliation.slug),
      );

    return isQueryMatched && isStreamerAffiliationMatched && isJobMatched;
  });
}

function getSelectedStreamerAffiliationSlugs(
  affiliations: StreamerAffiliation[],
  selectedSlugs: string[],
): Set<string> {
  const affiliationsBySlug = new Map(
    affiliations.map((affiliation) => [affiliation.slug, affiliation]),
  );
  const childrenByParentId = new Map<string, StreamerAffiliation[]>();

  for (const affiliation of affiliations) {
    if (!affiliation.parentAffiliationId) {
      continue;
    }

    const children =
      childrenByParentId.get(affiliation.parentAffiliationId) ?? [];
    children.push(affiliation);
    childrenByParentId.set(affiliation.parentAffiliationId, children);
  }

  const resolvedSlugs = new Set<string>();

  function addBranch(affiliation: StreamerAffiliation) {
    if (resolvedSlugs.has(affiliation.slug)) {
      return;
    }

    resolvedSlugs.add(affiliation.slug);

    for (const child of childrenByParentId.get(affiliation.id) ?? []) {
      addBranch(child);
    }
  }

  for (const slug of selectedSlugs) {
    const affiliation = affiliationsBySlug.get(slug);

    if (affiliation) {
      addBranch(affiliation);
    } else {
      resolvedSlugs.add(slug);
    }
  }

  return resolvedSlugs;
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
