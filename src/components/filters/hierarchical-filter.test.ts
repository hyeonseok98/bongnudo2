import { describe, expect, it } from "vitest";

import {
  filterTreeNodes,
  getDefaultFilterSelection,
  getFilterDraftSummary,
  getFilterNodeLabel,
  getFilterNodeLeafLabel,
  getFilterNodeSelectionState,
  getHierarchicalFilterNodeSelectionState,
  getSelectAllState,
  toggleHierarchicalFilterSelection,
  toggleFilterNodeSelection,
  type FilterTreeNode,
  type HierarchicalFilterSelection,
} from "./hierarchical-filter";

const NODES: FilterTreeNode[] = [
  {
    id: "project-i",
    label: "프로젝트 아이",
    children: [
      { id: "acacia", label: "아카시아" },
      { id: "honeys", label: "허니즈" },
    ],
  },
  { id: "swamp", label: "늪지대" },
];

describe("hierarchical filter selection", () => {
  it("기본 상태와 명시적 전체 선택을 UI draft로 구분함", () => {
    expect(getSelectAllState(false)).toEqual({
      checked: false,
      indeterminate: false,
    });
    expect(getSelectAllState(true)).toEqual({
      checked: true,
      indeterminate: false,
    });
  });

  it("parent와 sibling child를 복수 선택함", () => {
    const selection = toggleHierarchicalFilterSelection(
      NODES,
      { ids: ["swamp"] },
      "project-i",
    );

    expect(selection).toEqual({ ids: ["swamp", "project-i"] });
    expect(
      getHierarchicalFilterNodeSelectionState(
        NODES,
        selection,
        "acacia",
      ),
    ).toEqual({ checked: true, indeterminate: false });
  });

  it("parent 전체에서 child를 누르면 child refinement로 바꿈", () => {
    const selection = toggleHierarchicalFilterSelection(
      NODES,
      { ids: ["project-i"] },
      "acacia",
    );

    expect(selection).toEqual({ ids: ["acacia"] });
    expect(
      getHierarchicalFilterNodeSelectionState(
        NODES,
        selection,
        "project-i",
      ),
    ).toEqual({ checked: false, indeterminate: true });
  });

  it("disabled node toggle은 selection을 변경하지 않음", () => {
    const selection: HierarchicalFilterSelection = {
      ids: [],
    };

    expect(
      toggleHierarchicalFilterSelection(
        [{ id: "business", label: "사업체", count: 0, disabled: true }],
        selection,
        "business",
      ),
    ).toBe(selection);
  });

  it("선택 summary의 모든 leaf label을 생성함", () => {
    expect(
      getFilterDraftSummary(NODES, {
        ids: ["project-i", "acacia", "swamp", "unknown"],
      }),
    ).toEqual({
      items: [
        { id: "project-i", label: "프로젝트 아이" },
        { id: "acacia", label: "아카시아" },
        { id: "swamp", label: "늪지대" },
        { id: "unknown", label: "unknown" },
      ],
    });
    expect(getFilterDraftSummary(NODES, { ids: [] })).toBeNull();
    expect(getDefaultFilterSelection()).toEqual({ ids: [] });
  });

  it("parent를 전체 선택함", () => {
    expect(toggleFilterNodeSelection(NODES, [], "project-i")).toEqual([
      "project-i",
    ]);
    expect(
      getFilterNodeSelectionState(NODES[0], ["project-i"]),
    ).toEqual({ checked: true, indeterminate: false });
    expect(
      getFilterNodeSelectionState(
        NODES[0].children?.[0] ?? NODES[0],
        ["project-i"],
        "project-i",
      ),
    ).toEqual({ checked: true, indeterminate: false });
  });

  it("parent 전체에서 child 선택 시 child refinement로 교체함", () => {
    expect(
      toggleFilterNodeSelection(NODES, ["project-i"], "acacia"),
    ).toEqual(["acacia"]);
  });

  it("child가 선택되면 parent를 indeterminate로 표시함", () => {
    expect(getFilterNodeSelectionState(NODES[0], ["acacia"])).toEqual({
      checked: false,
      indeterminate: true,
    });
  });

  it("다른 branch 선택은 함께 유지하고 다시 누르면 해제함", () => {
    const selected = toggleFilterNodeSelection(NODES, ["acacia"], "swamp");

    expect(selected).toEqual(["acacia", "swamp"]);
    expect(toggleFilterNodeSelection(NODES, selected, "swamp")).toEqual([
      "acacia",
    ]);
  });
});

describe("hierarchical filter search", () => {
  it("child match 시 parent context를 유지함", () => {
    expect(filterTreeNodes(NODES, "아카")).toEqual([
      {
        id: "project-i",
        label: "프로젝트 아이",
        children: [{ id: "acacia", label: "아카시아" }],
      },
    ]);
  });

  it("parent match 시 모든 child를 유지함", () => {
    expect(filterTreeNodes(NODES, "젝트")).toEqual([NODES[0]]);
  });

  it("초성 한 글자와 여러 글자를 문자열 중간에서도 검색함", () => {
    expect(filterTreeNodes(NODES, "ㅇㅋ")).toEqual([
      {
        id: "project-i",
        label: "프로젝트 아이",
        children: [{ id: "acacia", label: "아카시아" }],
      },
    ]);
    expect(filterTreeNodes(NODES, "ㄴㅈ")).toEqual([
      {
        id: "project-i",
        label: "프로젝트 아이",
        children: [{ id: "honeys", label: "허니즈" }],
      },
      NODES[1],
    ]);
  });

  it("검색 결과가 없으면 빈 목록을 반환함", () => {
    expect(filterTreeNodes(NODES, "없는 소속")).toEqual([]);
  });
});

describe("hierarchical filter label", () => {
  it("child label에 parent context를 포함함", () => {
    expect(getFilterNodeLabel(NODES, "acacia")).toBe(
      "프로젝트 아이 > 아카시아",
    );
    expect(getFilterNodeLabel(NODES, "swamp")).toBe("늪지대");
    expect(getFilterNodeLeafLabel(NODES, "acacia")).toBe("아카시아");
  });
});
