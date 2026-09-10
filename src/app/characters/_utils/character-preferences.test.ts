import { describe, expect, it } from "vitest";

import {
  getStreamerAffiliationQueryState,
  getStreamerAffiliationSelection,
  hasExplicitCharacterPreferences,
} from "./character-preferences";

describe("streamer affiliation URL state", () => {
  it("초기 상태를 include no-filter로 해석함", () => {
    expect(getStreamerAffiliationSelection([], [])).toEqual({
      mode: "include",
      ids: [],
    });
  });

  it("기존 groups를 include mode로 유지하고 동시에 있으면 우선함", () => {
    expect(
      getStreamerAffiliationSelection(
        ["acacia", "swamp"],
        ["project-i"],
      ),
    ).toEqual({ mode: "include", ids: ["acacia", "swamp"] });
  });

  it("excludeGroups를 exclude mode로 해석함", () => {
    expect(getStreamerAffiliationSelection([], ["project-i"])).toEqual({
      mode: "exclude",
      ids: ["project-i"],
    });
    expect(hasExplicitCharacterPreferences("?excludeGroups=project-i")).toBe(
      true,
    );
  });

  it("include와 exclude 적용 시 반대 query를 제거함", () => {
    expect(
      getStreamerAffiliationQueryState({
        mode: "include",
        ids: ["acacia"],
      }),
    ).toEqual({ groups: ["acacia"], excludeGroups: null });
    expect(
      getStreamerAffiliationQueryState({
        mode: "exclude",
        ids: ["project-i"],
      }),
    ).toEqual({ groups: null, excludeGroups: ["project-i"] });
  });

  it("제외 없는 select-all 적용을 no-filter로 정규화함", () => {
    expect(
      getStreamerAffiliationQueryState({ mode: "exclude", ids: [] }),
    ).toEqual({ groups: null, excludeGroups: null });
  });
});
