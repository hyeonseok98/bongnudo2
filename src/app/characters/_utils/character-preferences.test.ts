import { describe, expect, it } from "vitest";

import {
  getFilterQueryValue,
  getLegacyJobSelection,
  getStreamerAffiliationSelection,
  hasExplicitCharacterPreferences,
} from "./character-preferences";

describe("character filter URL state", () => {
  it("빈 groups를 no-filter로 해석함", () => {
    expect(getStreamerAffiliationSelection([])).toEqual({ ids: [] });
  });

  it("groups를 중복과 공백 없이 복수 선택으로 유지함", () => {
    expect(
      getStreamerAffiliationSelection(["acacia", " swamp ", "acacia"]),
    ).toEqual({ ids: ["acacia", "swamp"] });
  });

  it("새 jobs query를 복수 선택으로 round-trip함", () => {
    const selection = getLegacyJobSelection(["police", "ems"], "all", "");

    expect(selection).toEqual({ ids: ["police", "ems"] });
    expect(getFilterQueryValue(selection)).toEqual(["police", "ems"]);
    expect(hasExplicitCharacterPreferences("?jobs=police,ems")).toBe(true);
  });

  it("기존 단일 직업 URL을 새 selection으로 해석함", () => {
    expect(getLegacyJobSelection([], "public-service", "police")).toEqual({
      ids: ["police"],
    });
    expect(getLegacyJobSelection([], "business", "")).toEqual({
      ids: ["business"],
    });
  });

  it("빈 선택은 query에서 제거함", () => {
    expect(getFilterQueryValue({ ids: [] })).toBeNull();
  });
});
