import { describe, expect, it } from "vitest";

import type {
  CharacterAffiliation,
  CharacterListItem,
  CharacterStreamerAffiliation,
  StreamerAffiliation,
} from "@/features/characters/character";

import {
  buildCharacterFilterFacetData,
  buildCharacterDirectoryItems,
  buildJobAffiliationFilterNodes,
  buildStreamerAffiliationFilterData,
  filterCharacters,
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
  slug: "business-office",
  name: "사업체 조직",
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
  it("직업 대분류 5개를 유지하고 0명 root를 disabled로 생성함", () => {
    const nodes = buildJobAffiliationFilterNodes(CHARACTERS);

    expect(nodes.map((node) => [node.id, node.count, node.disabled])).toEqual([
      ["public-service", 2, false],
      ["business", 1, false],
      ["illegal-business", 0, true],
      ["gang", 0, true],
      ["crew", 0, true],
    ]);
    expect(nodes[0].children).toEqual([
      { id: "police", label: "경찰", count: 2 },
    ]);
    expect(nodes[1].children).toEqual([
      { id: "business-office", label: "사업체 조직", count: 1 },
    ]);
  });

  it("직업 조건을 적용한 소속 facet에서 0명 항목을 제거함", () => {
    const result = buildCharacterFilterFacetData(
      CHARACTERS,
      STREAMER_AFFILIATIONS,
      {
        query: "",
        jobSelection: { ids: ["police"] },
        streamerAffiliationSelection: { ids: [] },
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
        jobSelection: { ids: ["business-office"] },
        streamerAffiliationSelection: { ids: ["acacia"] },
      },
    );

    expect(result.jobNodes.map((node) => [
      node.id,
      node.count,
      node.disabled,
      node.children?.map((child) => child.id),
    ])).toEqual([
      ["public-service", 1, false, ["police"]],
      ["business", 0, true, []],
      ["illegal-business", 0, true, []],
      ["gang", 0, true, []],
      ["crew", 0, true, []],
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
        jobSelection: { ids: [] },
        streamerAffiliationSelection: { ids: [] },
      },
    );

    expect(result.jobNodes.map((node) => [node.id, node.count])).toEqual([
      ["public-service", 1],
      ["business", 0],
      ["illegal-business", 0],
      ["gang", 0],
      ["crew", 0],
    ]);
    expect(result.jobNodes[0].children).toEqual([
      { id: "police", label: "경찰", count: 1 },
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

});

describe("character filtering", () => {
  it("RP명과 스트리머명에서 완성형·초성·중간 문자열 검색을 지원함", () => {
    const searchableCharacters = [
      createCharacter({
        id: "rp-name",
        slug: "streamer-a",
        streamerName: "하루토",
        rpName: "사랑화",
        streamerAffiliations: [],
      }),
      createCharacter({
        id: "streamer-name",
        slug: "streamer-b",
        streamerName: "카론 유니버스",
        rpName: null,
        streamerAffiliations: [],
      }),
    ];

    expect(
      filterCharacters(searchableCharacters, {
        query: "랑화",
        jobSelection: { ids: [] },
        streamerAffiliationSelection: { ids: [] },
      }).map((character) => character.id),
    ).toEqual(["rp-name"]);
    expect(
      filterCharacters(searchableCharacters, {
        query: "ㅅㄹ",
        jobSelection: { ids: [] },
        streamerAffiliationSelection: { ids: [] },
      }).map((character) => character.id),
    ).toEqual(["rp-name"]);
    expect(
      filterCharacters(searchableCharacters, {
        query: "니버",
        jobSelection: { ids: [] },
        streamerAffiliationSelection: { ids: [] },
      }).map((character) => character.id),
    ).toEqual(["streamer-name"]);
    expect(
      filterCharacters(searchableCharacters, {
        query: "ㅋㄹ",
        jobSelection: { ids: [] },
        streamerAffiliationSelection: { ids: [] },
      }).map((character) => character.id),
    ).toEqual(["streamer-name"]);
  });

  it("서로 다른 현실 소속 branch를 OR로 처리함", () => {
    const result = filterCharacters(CHARACTERS, {
      query: "",
      jobSelection: { ids: [] },
      streamerAffiliationSelection: { ids: ["acacia", "swamp"] },
    });

    expect(result.map((character) => character.id)).toEqual([
      "character-a",
      "character-c",
    ]);
  });

  it("직업 sibling 복수 선택을 OR로 처리함", () => {
    const result = filterCharacters(CHARACTERS, {
      query: "",
      jobSelection: { ids: ["public-service", "business-office"] },
      streamerAffiliationSelection: { ids: [] },
    });

    expect(result.map((character) => character.id)).toEqual([
      "character-a",
      "character-b",
      "character-c",
    ]);
  });

  it("직업과 현실 소속을 AND로 처리함", () => {
    const result = filterCharacters(CHARACTERS, {
      query: "",
      jobSelection: { ids: ["public-service"] },
      streamerAffiliationSelection: { ids: ["project-i"] },
    });

    expect(result.map((character) => character.id)).toEqual(["character-a"]);
  });

  it("기존 groups URL의 slug와 숨김 항목도 계속 filtering함", () => {
    const result = filterCharacters(CHARACTERS, {
      query: "",
      jobSelection: { ids: [] },
      streamerAffiliationSelection: { ids: ["hidden-group"] },
    });

    expect(result.map((character) => character.id)).toEqual([
      "character-hidden",
    ]);
  });

  it("소속 parent 선택을 descendant 전체 branch로 처리함", () => {
    const childOnlyCharacter = createCharacter({
      id: "child-only",
      slug: "자식",
      streamerAffiliations: [
        createCharacterStreamerAffiliation("group-acacia", "acacia", "group"),
      ],
    });
    const result = filterCharacters(
      [childOnlyCharacter],
      {
        query: "",
        jobSelection: { ids: [] },
        streamerAffiliationSelection: { ids: ["project-i"] },
      },
      STREAMER_AFFILIATIONS,
    );

    expect(result).toEqual([childOnlyCharacter]);
  });

});

describe("character directory view model", () => {
  it("스트리머는 streamer id로 중복 제거하고 RP는 rpName이 있는 참가자만 만듦", () => {
    const rpCharacter = createCharacter({
      id: "participant-rp",
      slug: "강지",
      streamerName: "강지",
      rpName: "도현정",
      rpProfileImageUrl: "https://assets.example.com/rp-profile.webp",
      streamerAffiliations: [],
    });
    const duplicateStreamer = createCharacter({
      id: "participant-rp-2",
      slug: "강지",
      streamerName: "강지",
      rpName: null,
      streamerAffiliations: [],
    });

    expect(
      buildCharacterDirectoryItems(
        [rpCharacter, duplicateStreamer],
        "streamer",
      ),
    ).toHaveLength(1);
    expect(
      buildCharacterDirectoryItems(
        [rpCharacter, duplicateStreamer],
        "rp",
      ),
    ).toMatchObject([
      {
        id: "participant-rp",
        href: "/characters/rp/participant-rp",
        primaryName: "도현정",
        profileImageUrl: "https://assets.example.com/rp-profile.webp",
      },
    ]);
  });

  it("RP 프로필 이미지가 없으면 스트리머 프로필 이미지로 대체하지 않음", () => {
    const character = createCharacter({
      rpName: "도현정",
      rpProfileImageUrl: null,
      profileImageUrl: "https://assets.example.com/streamer-profile.webp",
    });

    expect(buildCharacterDirectoryItems([character], "rp")).toMatchObject([
      { profileImageUrl: null },
    ]);
  });
});

function createStreamerAffiliation(
  overrides: Partial<StreamerAffiliation> &
    Pick<StreamerAffiliation, "id" | "slug" | "name">,
): StreamerAffiliation {
  return {
    birthDate: null,
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
  streamerName = slug,
  rpName = null,
  rpProfileImageUrl = null,
  streamerAffiliations,
}: {
  id: string;
  slug: string;
  affiliations?: CharacterAffiliation[];
  streamerName?: string;
  rpName?: string | null;
  rpProfileImageUrl?: string | null;
  streamerAffiliations: CharacterStreamerAffiliation[];
}): CharacterListItem {
  return {
    id,
    streamerId: "streamer-" + slug,
    chzzkChannelId: "channel-" + slug,
    slug,
    streamerName,
    rpName,
    profileImageUrl: null,
    rpProfileImageUrl,
    channelUrl: null,
    streamerAffiliations,
    affiliations,
    roleHistories: [],
    statedAge: null,
  };
}
