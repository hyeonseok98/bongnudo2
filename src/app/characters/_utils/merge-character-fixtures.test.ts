import { describe, expect, it } from "vitest";

import type { CharacterListItem } from "@/features/characters/character";

import { mergeCharactersWithFixtures } from "./merge-character-fixtures";

const databaseCharacter: CharacterListItem = {
  id: "database-id",
  slug: "gangji",
  streamerName: "강지",
  rpName: null,
  profileImageUrl: null,
  group: null,
  affiliations: [
    {
      id: "database-membership",
      slug: "ems",
      name: "EMS",
      category: "public-service",
      role: "병원장",
      isPrimary: true,
      isLeader: false,
    },
  ],
};

const fixtureCharacter: CharacterListItem = {
  id: "fixture-id",
  slug: "gangji",
  streamerName: "강지",
  rpName: "정감자",
  profileImageUrl: null,
  group: { slug: "stellive", name: "스텔라이브" },
  affiliations: [
    {
      id: "fixture-membership",
      slug: "ems",
      name: "EMS",
      category: "public-service",
      role: "병원장",
      isPrimary: true,
      isLeader: true,
    },
    {
      id: "fixture-crew",
      slug: "dawn-crew",
      name: "새벽크루",
      category: "crew",
      role: null,
      isPrimary: false,
      isLeader: false,
    },
  ],
};

describe("mergeCharactersWithFixtures", () => {
  it("DB 식별자를 유지하면서 아직 DB에 없는 fixture 상세 정보를 보완함", () => {
    const [character] = mergeCharactersWithFixtures(
      [databaseCharacter],
      [fixtureCharacter],
    );

    expect(character.id).toBe("database-id");
    expect(character.rpName).toBe("정감자");
    expect(character.group?.slug).toBe("stellive");
    expect(character.affiliations).toEqual([
      expect.objectContaining({
        id: "database-membership",
        slug: "ems",
        isLeader: true,
      }),
      expect.objectContaining({ slug: "dawn-crew" }),
    ]);
  });
});
