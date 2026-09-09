import { describe, expect, it } from "vitest";

import {
  filterTreeNodes,
  getFilterNodeLabel,
  getFilterNodeSelectionState,
  toggleFilterNodeSelection,
  type FilterTreeNode,
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
