import { describe, expect, it } from "vitest";

import type {
  CharacterAffiliation,
  CharacterListItem,
  CharacterStreamerAffiliation,
  StreamerAffiliation,
} from "@/features/characters/character";

import {
  buildCharacterFilterFacetData,
  buildJobAffiliationFilterNodes,
  buildStreamerAffiliationFilterData,
  filterCharacters,
  getJobAffiliationFilterSelection,
  getJobAffiliationFilterValue,
  getStreamerAffiliationFilterLabel,
} from "./character-directory";

const POLICE_AFFILIATION: CharacterAffiliation = {
  id: "police-membership",
  slug: "police",
  name: "경찰",
  category: "public-service",
  role: "순경",
  isPrimary: true,
  displayOrder: 1,
  isLeader: false,
};

const BUSINESS_AFFILIATION: CharacterAffiliation = {
  ...POLICE_AFFILIATION,
  id: "business-membership",
  slug: "company",
  name: "회사",
  category: "business",
};

const STREAMER_AFFILIATIONS: StreamerAffiliation[] = [
  createStreamerAffiliation({
    id: "mcn-project-i",
    slug: "project-i",
    name: "프로젝트 아이",
    filterOrder: 2,
    isQuickFilter: true,
    quickFilterLabel: "프아이",
  }),
  createStreamerAffiliation({
    id: "group-acacia",
    slug: "acacia",
    name: "아카시아",
    type: "group",
    parentAffiliationId: "mcn-project-i",
    filterOrder: 4,
  }),
  createStreamerAffiliation({
    id: "group-honeys",
    slug: "honeys",
    name: "허니즈",
    type: "group",
    parentAffiliationId: "mcn-project-i",
    filterOrder: 3,
  }),
  createStreamerAffiliation({
    id: "group-swamp",
    slug: "swamp",
    name: "늪지대",
    type: "group",
    filterOrder: 1,
    isQuickFilter: true,
  }),
  createStreamerAffiliation({
    id: "group-zero",
    slug: "zero-group",
    name: "0명 소속",
    type: "group",
    filterOrder: 5,
  }),
  createStreamerAffiliation({
    id: "group-hidden",
    slug: "hidden-group",
    name: "숨김 소속",
    type: "group",
    filterOrder: 0,
    isFilterVisible: false,
  }),
];

const CHARACTERS: CharacterListItem[] = [
  createCharacter({
    id: "character-a",
    slug: "가",
    affiliations: [POLICE_AFFILIATION],
    streamerAffiliations: [
      createCharacterStreamerAffiliation("mcn-project-i", "project-i"),
      createCharacterStreamerAffiliation("group-acacia", "acacia", "group"),
      createCharacterStreamerAffiliation("group-acacia", "acacia", "group"),
    ],
  }),
  createCharacter({
    id: "character-b",
    slug: "나",
    affiliations: [BUSINESS_AFFILIATION],
    streamerAffiliations: [
      createCharacterStreamerAffiliation("mcn-project-i", "project-i"),
      createCharacterStreamerAffiliation("group-honeys", "honeys", "group"),
    ],
  }),
  createCharacter({
    id: "character-c",
    slug: "다",
    affiliations: [POLICE_AFFILIATION],
    streamerAffiliations: [
      createCharacterStreamerAffiliation("group-swamp", "swamp", "group"),
    ],
  }),
  createCharacter({
    id: "character-hidden",
    slug: "라",
    streamerAffiliations: [
      createCharacterStreamerAffiliation(
        "group-hidden",
        "hidden-group",
        "group",
      ),
    ],
  }),
];

describe("streamer affiliation filter data", () => {
  it("visible 항목만 filter_order 순서의 2단계 tree로 생성함", () => {
    const result = buildStreamerAffiliationFilterData(
      CHARACTERS,
      STREAMER_AFFILIATIONS,
    );

    expect(result.nodes.map((node) => node.id)).toEqual([
      "swamp",
      "project-i",
    ]);
    expect(result.nodes[1].children?.map((node) => node.id)).toEqual([
      "honeys",
      "acacia",
    ]);
  });

  it("character id Set으로 중복 없이 count를 계산함", () => {
    const result = buildStreamerAffiliationFilterData(
      CHARACTERS,
      STREAMER_AFFILIATIONS,
    );

    expect(result.nodes[0].count).toBe(1);
    expect(result.nodes[1].count).toBe(2);
    expect(
      result.nodes[1].children?.find((node) => node.id === "acacia")?.count,
    ).toBe(1);
  });

  it("parent 직접 count가 0이어도 0보다 큰 child의 계층 context를 유지함", () => {
    const childOnlyCharacter = createCharacter({
      id: "child-only",
      slug: "자식",
      streamerAffiliations: [
        createCharacterStreamerAffiliation("group-acacia", "acacia", "group"),
      ],
    });
    const result = buildStreamerAffiliationFilterData(
      [childOnlyCharacter],
      STREAMER_AFFILIATIONS,
    );

    expect(result.nodes).toEqual([
      {
        id: "project-i",
        label: "프로젝트 아이",
        count: 0,
        children: [{ id: "acacia", label: "아카시아", count: 1 }],
      },
    ]);
  });
  it("quick metadata와 계층 label을 사용함", () => {
    const result = buildStreamerAffiliationFilterData(
      CHARACTERS,
      STREAMER_AFFILIATIONS,
    );

    expect(result.quickOptions).toEqual([
      { id: "swamp", label: "늪지대" },
      { id: "project-i", label: "프아이" },
    ]);
    expect(
      getStreamerAffiliationFilterLabel(STREAMER_AFFILIATIONS, "acacia"),
    ).toBe("프로젝트 아이 > 아카시아");
  });
});

describe("character filter facets", () => {
  it("직업 대분류와 세부 affiliation tree를 count와 함께 생성함", () => {
    const nodes = buildJobAffiliationFilterNodes(CHARACTERS);

    expect(nodes.map((node) => [node.id, node.count])).toEqual([
      ["public-service", 2],
      ["business", 1],
    ]);
    expect(nodes[0].children).toEqual([
      { id: "police", label: "경찰", count: 2 },
    ]);
    expect(nodes[1].children).toEqual([
      { id: "company", label: "회사", count: 1 },
    ]);
  });

  it("직업 조건을 적용한 소속 facet에서 0명 항목을 제거함", () => {
    const result = buildCharacterFilterFacetData(
      CHARACTERS,
      STREAMER_AFFILIATIONS,
      {
        query: "",
        affiliationType: "public-service",
        affiliationSlug: "police",
        selectedStreamerAffiliationSlugs: [],
      },
    );

    expect(result.streamerAffiliations.nodes.map((node) => node.id)).toEqual([
      "swamp",
      "project-i",
    ]);
    expect(result.streamerAffiliations.nodes[1]).toMatchObject({
      id: "project-i",
      count: 1,
      children: [{ id: "acacia", count: 1 }],
    });
    expect(result.streamerAffiliations.quickOptions.map((option) => option.id)).toEqual([
      "swamp",
      "project-i",
    ]);
  });

  it("소속 조건은 직업 facet에만 적용하고 자기 facet count에서는 제외함", () => {
    const result = buildCharacterFilterFacetData(
      CHARACTERS,
      STREAMER_AFFILIATIONS,
      {
        query: "",
        affiliationType: "business",
        affiliationSlug: "company",
        selectedStreamerAffiliationSlugs: ["acacia"],
      },
    );

    expect(result.jobNodes).toEqual([
      {
        id: "public-service",
        label: "공무직",
        count: 1,
        children: [{ id: "police", label: "경찰", count: 1 }],
      },
    ]);
    expect(
      result.streamerAffiliations.nodes.find(
        (node) => node.id === "project-i",
      ),
    ).toMatchObject({
      count: 1,
      children: [{ id: "honeys", count: 1 }],
    });
    expect(
      result.streamerAffiliations.nodes.some(
        (node) => node.id === "zero-group",
      ),
    ).toBe(false);
  });

  it("검색어를 직업과 소속 facet base에 모두 적용함", () => {
    const result = buildCharacterFilterFacetData(
      CHARACTERS,
      STREAMER_AFFILIATIONS,
      {
        query: "가",
        affiliationType: "all",
        affiliationSlug: null,
        selectedStreamerAffiliationSlugs: [],
      },
    );

    expect(result.jobNodes).toEqual([
      {
        id: "public-service",
        label: "공무직",
        count: 1,
        children: [{ id: "police", label: "경찰", count: 1 }],
      },
    ]);
    expect(result.streamerAffiliations.nodes).toEqual([
      {
        id: "project-i",
        label: "프로젝트 아이",
        count: 1,
        children: [{ id: "acacia", label: "아카시아", count: 1 }],
      },
    ]);
  });

  it("직업 계층 선택을 기존 URL query 구조로 변환함", () => {
    const nodes = buildJobAffiliationFilterNodes(CHARACTERS);

    expect(getJobAffiliationFilterValue("public-service", "police")).toEqual([
      "police",
    ]);
    expect(getJobAffiliationFilterSelection(nodes, ["police"])).toEqual({
      affiliationType: "public-service",
      affiliationSlug: "police",
    });
    expect(getJobAffiliationFilterSelection(nodes, ["business"])).toEqual({
      affiliationType: "business",
      affiliationSlug: null,
    });
    expect(getJobAffiliationFilterSelection(nodes, [])).toEqual({
      affiliationType: "all",
      affiliationSlug: null,
    });
  });
});

describe("character filtering", () => {
  it("서로 다른 현실 소속 branch를 OR로 처리함", () => {
    const result = filterCharacters(CHARACTERS, {
      query: "",
      affiliationType: "all",
      affiliationSlug: null,
      selectedStreamerAffiliationSlugs: ["acacia", "swamp"],
    });

    expect(result.map((character) => character.id)).toEqual([
      "character-a",
      "character-c",
    ]);
  });

  it("직업과 현실 소속을 AND로 처리함", () => {
    const result = filterCharacters(CHARACTERS, {
      query: "",
      affiliationType: "public-service",
      affiliationSlug: null,
      selectedStreamerAffiliationSlugs: ["project-i", "swamp"],
    });

    expect(result.map((character) => character.id)).toEqual([
      "character-a",
      "character-c",
    ]);
  });

  it("기존 groups URL의 slug와 숨김 항목도 계속 filtering함", () => {
    const result = filterCharacters(CHARACTERS, {
      query: "",
      affiliationType: "all",
      affiliationSlug: null,
      selectedStreamerAffiliationSlugs: ["hidden-group"],
    });

    expect(result.map((character) => character.id)).toEqual([
      "character-hidden",
    ]);
  });
});

function createStreamerAffiliation(
  overrides: Partial<StreamerAffiliation> &
    Pick<StreamerAffiliation, "id" | "slug" | "name">,
): StreamerAffiliation {
  return {
    type: "mcn",
    parentAffiliationId: null,
    isFilterVisible: true,
    isQuickFilter: false,
    quickFilterLabel: null,
    filterOrder: null,
    ...overrides,
  };
}

function createCharacterStreamerAffiliation(
  id: string,
  slug: string,
  type: "mcn" | "group" = "mcn",
): CharacterStreamerAffiliation {
  return {
    id,
    slug,
    name: slug,
    type,
    sortOrder: 1,
  };
}

function createCharacter({
  id,
  slug,
  affiliations = [],
  streamerAffiliations,
}: {
  id: string;
  slug: string;
  affiliations?: CharacterAffiliation[];
  streamerAffiliations: CharacterStreamerAffiliation[];
}): CharacterListItem {
  return {
    id,
    streamerId: "streamer-" + slug,
    slug,
    streamerName: slug,
    rpName: null,
    profileImageUrl: null,
    streamerAffiliations,
    affiliations,
  };
}
