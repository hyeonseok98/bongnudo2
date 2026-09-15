import { describe, expect, it } from "vitest";

import { getDisplayName } from "./rp-mode";

const entity = {
  streamerName: "강지",
  rpName: "도현정",
};

describe("getDisplayName", () => {
  it("스트리머 도감의 RP 모드에서는 스트리머명만 표시함", () => {
    expect(getDisplayName(entity, "streamer-card", true)).toEqual({
      primaryName: "강지",
      secondaryName: null,
    });
  });

  it("RP 도감의 RP 모드에서는 스트리머명을 표시하지 않음", () => {
    expect(getDisplayName(entity, "character-card", true)).toEqual({
      primaryName: "도현정",
      secondaryName: null,
    });
  });

  it("RP 모드 LIVE에서 RP명이 없으면 중립 문구를 표시함", () => {
    expect(
      getDisplayName(
        { streamerName: "강지", rpName: null },
        "live",
        true,
      ),
    ).toEqual({
      primaryName: "RP 정보 없음",
      secondaryName: null,
    });
  });

  it("RP 모드가 아니면 LIVE에 RP명과 스트리머명을 함께 표시함", () => {
    expect(getDisplayName(entity, "live", false)).toEqual({
      primaryName: "도현정",
      secondaryName: "강지",
    });
  });
});
