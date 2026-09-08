import { describe, expect, it } from "vitest";

import type { CharacterListItem } from "@/features/characters/character";

import {
  filterCharacters,
  getAvailableGroups,
} from "./character-directory";

function createCharacter(
  slug: string,
  groupSlug: string | null,
): CharacterListItem {
  return {
    id: `participant-${slug}`,
    streamerId: `streamer-${slug}`,
    slug,
    streamerName: slug,
    rpName: null,
    profileImageUrl: null,
    streamerAffiliations: [
      {
        id: `mcn-${slug}`,
        slug: "shared-mcn",
        name: "공통 MCN",
        type: "mcn",
        sortOrder: 1,
      },
      ...(groupSlug
        ? [
            {
              id: `group-${slug}`,
              slug: groupSlug,
              name: groupSlug,
              type: "group" as const,
              sortOrder: 1,
            },
          ]
        : []),
    ],
    affiliations: [],
  };
}

describe("character directory group data", () => {
  const characters = [
    createCharacter("가", "동적 그룹 B"),
    createCharacter("나", "동적 그룹 A"),
    createCharacter("다", null),
  ];

  it("Supabase 현실 소속 중 group만 필터 선택지로 사용함", () => {
    expect(getAvailableGroups(characters)).toEqual([
      { slug: "동적 그룹 A", name: "동적 그룹 A" },
      { slug: "동적 그룹 B", name: "동적 그룹 B" },
    ]);
  });

  it("선택한 group affiliation을 가진 인물만 표시함", () => {
    const filtered = filterCharacters(characters, {
      query: "",
      affiliationType: "all",
      affiliationSlug: null,
      selectedGroupIds: ["동적 그룹 A"],
    });

    expect(filtered.map(({ slug }) => slug)).toEqual(["나"]);
  });
});
