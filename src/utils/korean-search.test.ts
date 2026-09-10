import { describe, expect, it } from "vitest";

import { matchesKoreanSearch } from "./korean-search";

describe("matchesKoreanSearch", () => {
  it.each([
    ["스텔라이브", "라이"],
    ["프로젝트 아이", "프로"],
    ["스텔라이브", "ㅅ"],
    ["스텔라이브", "ㅅㅌ"],
    ["카론 유니버스", "ㅇㄴㅂㅅ"],
    ["카론 유니버스", "ㄴㅂ"],
    ["카론 유니버스", "유"],
  ])("%s에 %s가 포함되면 일치함", (label, query) => {
    expect(matchesKoreanSearch(label, query)).toBe(true);
  });

  it("초성 또는 일반 문자열이 없으면 일치하지 않음", () => {
    expect(matchesKoreanSearch("스텔라이브", "ㅍㅅ")).toBe(false);
    expect(matchesKoreanSearch("스텔라이브", "프로")).toBe(false);
  });
});
