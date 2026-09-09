import { describe, expect, it } from "vitest";

import { validateStreamerAffiliations } from "../../tools/bongnudo2-excel-data.mjs";

interface TestAffiliation {
  row: number;
  name: string;
  type: string;
  parentName: string | null;
  isFilterVisible: boolean | null;
  isQuickFilter: boolean | null;
  quickFilterLabel: string | null;
  filterOrder: number | null;
}

interface TestPersonAffiliation {
  name: string;
  type: "mcn" | "group";
}

function affiliation(
  name: string,
  type: "mcn" | "group",
  filterOrder: number,
  overrides: Partial<TestAffiliation> = {},
): TestAffiliation {
  return {
    row: filterOrder + 1,
    name,
    type,
    parentName: null,
    isFilterVisible: true,
    isQuickFilter: false,
    quickFilterLabel: null,
    filterOrder,
    ...overrides,
  };
}

function personAffiliations(affiliations: TestPersonAffiliation[]) {
  return [{ row: 2, affiliations }];
}

function messages(
  affiliations: TestAffiliation[],
  people = personAffiliations([]),
) {
  return validateStreamerAffiliations(people, affiliations).map(
    (error: { message: string }) => error.message,
  );
}

describe("validateStreamerAffiliations", () => {
  it("2단계 관계와 독립 group 및 개인 MCN 조합을 허용함", () => {
    const affiliations = [
      affiliation("MCN", "mcn", 1),
      affiliation("하위 그룹", "group", 2, { parentName: "MCN" }),
      affiliation("독립 그룹", "group", 3),
      affiliation("개인 MCN", "mcn", 4),
    ];

    expect(
      messages(
        affiliations,
        personAffiliations([
          { name: "독립 그룹", type: "group" },
          { name: "개인 MCN", type: "mcn" },
        ]),
      ),
    ).toEqual([]);
  });

  it("계층·필터·master 참조의 잘못된 입력을 모두 거부함", () => {
    const cases = [
      {
        name: "존재하지 않는 parent",
        affiliations: [
          affiliation("그룹", "group", 1, { parentName: "없음" }),
        ],
        people: personAffiliations([]),
        expected: "존재하지 않는 상위 소속",
      },
      {
        name: "self parent",
        affiliations: [
          affiliation("그룹", "group", 1, { parentName: "그룹" }),
        ],
        people: personAffiliations([]),
        expected: "자기 자신",
      },
      {
        name: "3단계 hierarchy",
        affiliations: [
          affiliation("A", "mcn", 1),
          affiliation("B", "group", 2, { parentName: "A" }),
          affiliation("C", "group", 3, { parentName: "B" }),
        ],
        people: personAffiliations([]),
        expected: "최대 2단계",
      },
      {
        name: "cycle",
        affiliations: [
          affiliation("A", "mcn", 1, { parentName: "B" }),
          affiliation("B", "group", 2, { parentName: "A" }),
        ],
        people: personAffiliations([]),
        expected: "cycle",
      },
      {
        name: "중복 filter order",
        affiliations: [
          affiliation("A", "mcn", 1),
          affiliation("B", "group", 1),
        ],
        people: personAffiliations([]),
        expected: "표시 순서 중복",
      },
      {
        name: "quick filter label 누락",
        affiliations: [
          affiliation("A", "mcn", 1, { isQuickFilter: true }),
        ],
        people: personAffiliations([]),
        expected: "빠른 선택 표시명 누락",
      },
      {
        name: "숨김 quick filter",
        affiliations: [
          affiliation("A", "mcn", 1, {
            isFilterVisible: false,
            isQuickFilter: true,
            quickFilterLabel: "A",
          }),
        ],
        people: personAffiliations([]),
        expected: "필터에 노출",
      },
      {
        name: "master 누락",
        affiliations: [],
        people: personAffiliations([{ name: "A", type: "mcn" }]),
        expected: "스트리머소속 시트에 없는 소속",
      },
      {
        name: "인물 컬럼 type 불일치",
        affiliations: [affiliation("A", "group", 1)],
        people: personAffiliations([{ name: "A", type: "mcn" }]),
        expected: "유형 불일치",
      },
    ];

    for (const testCase of cases) {
      expect(
        messages(testCase.affiliations, testCase.people).some((message) =>
          message.includes(testCase.expected),
        ),
        testCase.name,
      ).toBe(true);
    }
  });
});
