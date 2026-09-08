import type {
  CharacterAffiliation,
  CharacterListItem,
} from "@/features/characters/character";

export function mergeCharactersWithFixtures(
  characters: CharacterListItem[],
  fixtures: CharacterListItem[],
): CharacterListItem[] {
  const fixturesBySlug = new Map(
    fixtures.map((fixture) => [fixture.slug, fixture]),
  );
  const characterSlugs = new Set(
    characters.map((character) => character.slug),
  );

  const mergedCharacters = characters.map((character) => {
    const fixture = fixturesBySlug.get(character.slug);

    if (!fixture) {
      return character;
    }

    return {
      ...character,
      rpName: character.rpName ?? fixture.rpName,
      profileImageUrl:
        character.profileImageUrl ?? fixture.profileImageUrl,
      group: character.group ?? fixture.group,
      affiliations: mergeAffiliations(
        character.affiliations,
        fixture.affiliations,
      ),
    };
  });

  return [
    ...mergedCharacters,
    ...fixtures.filter((fixture) => !characterSlugs.has(fixture.slug)),
  ];
}

function mergeAffiliations(
  affiliations: CharacterAffiliation[],
  fixtureAffiliations: CharacterAffiliation[],
): CharacterAffiliation[] {
  const affiliationsBySlug = new Map(
    fixtureAffiliations.map((affiliation) => [
      affiliation.slug,
      affiliation,
    ]),
  );

  for (const affiliation of affiliations) {
    const fixtureAffiliation = affiliationsBySlug.get(affiliation.slug);

    affiliationsBySlug.set(affiliation.slug, {
      ...fixtureAffiliation,
      ...affiliation,
      isLeader:
        fixtureAffiliation?.isLeader ?? affiliation.isLeader,
    });
  }

  return Array.from(affiliationsBySlug.values());
}
