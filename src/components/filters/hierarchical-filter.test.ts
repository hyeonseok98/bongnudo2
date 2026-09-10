import { describe, expect, it } from "vitest";

import {
  filterTreeNodes,
  getDefaultFilterSelection,
  getDraftSummaryLabel,
  getFilterNodeLabel,
  getFilterNodeSelectionState,
  getHierarchicalFilterNodeSelectionState,
  getSelectAllState,
  toggleHierarchicalFilterSelection,
  toggleSelectAll,
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
  it("초기 no-filter와 명시적 전체 선택을 구분함", () => {
    const initialSelection: HierarchicalFilterSelection = {
      mode: "include",
      ids: [],
    };
    const selectAllSelection = toggleSelectAll(initialSelection, "multiple");

    expect(getSelectAllState(initialSelection, "multiple")).toEqual({
      checked: false,
      indeterminate: false,
    });
    expect(selectAllSelection).toEqual({ mode: "exclude", ids: [] });
    expect(getSelectAllState(selectAllSelection, "multiple")).toEqual({
      checked: true,
      indeterminate: false,
    });
  });

  it("전체 선택에서 parent를 하나 제외함", () => {
    const selection = toggleHierarchicalFilterSelection(
      NODES,
      { mode: "exclude", ids: [] },
      "project-i",
      "multiple",
    );

    expect(selection).toEqual({ mode: "exclude", ids: ["project-i"] });
    expect(
      getHierarchicalFilterNodeSelectionState(
        NODES,
        selection,
        "acacia",
      ),
    ).toEqual({ checked: false, indeterminate: false });
  });

  it("전체 선택에서 child를 하나 제외함", () => {
    const selection = toggleHierarchicalFilterSelection(
      NODES,
      { mode: "exclude", ids: [] },
      "acacia",
      "multiple",
    );

    expect(selection).toEqual({ mode: "exclude", ids: ["acacia"] });
    expect(
      getHierarchicalFilterNodeSelectionState(
        NODES,
        selection,
        "project-i",
      ),
    ).toEqual({ checked: false, indeterminate: true });
  });

  it("직업 전체는 single selection을 비움", () => {
    expect(
      toggleSelectAll({ mode: "include", ids: ["project-i"] }, "single"),
    ).toEqual({ mode: "include", ids: [] });
  });

  it("disabled node toggle은 selection을 변경하지 않음", () => {
    const selection: HierarchicalFilterSelection = {
      mode: "include",
      ids: [],
    };

    expect(
      toggleHierarchicalFilterSelection(
        [{ id: "business", label: "사업체", count: 0, disabled: true }],
        selection,
        "business",
        "single",
      ),
    ).toBe(selection);
  });

  it("include/exclude summary와 panel reset 상태를 구분함", () => {
    expect(
      getDraftSummaryLabel({ mode: "include", ids: ["project-i"] }),
    ).toBe("선택 1");
    expect(
      getDraftSummaryLabel({ mode: "exclude", ids: ["project-i"] }),
    ).toBe("제외 1");
    expect(getDraftSummaryLabel({ mode: "exclude", ids: [] })).toBe(
      "전체 선택",
    );
    expect(getDefaultFilterSelection()).toEqual({ mode: "include", ids: [] });
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
  });
});
