import { describe, expect, it } from "vitest";

import { getChzzkClipEmbedUrl, parseChzzkClipUrl } from "./chzzk-clip";

describe("parseChzzkClipUrl", () => {
  it("공식 CHZZK 클립 주소를 canonical URL로 변환함", () => {
    expect(
      parseChzzkClipUrl(
        "https://chzzk.naver.com/clips/99ymxtsjqP?share=1#player",
      ),
    ).toEqual({
      clipId: "99ymxtsjqP",
      url: "https://chzzk.naver.com/clips/99ymxtsjqP",
    });
  });

  it.each([
    "http://chzzk.naver.com/clips/99ymxtsjqP",
    "https://clips.chzzk.naver.com/99ymxtsjqP",
    "https://example.com/clips/99ymxtsjqP",
    "https://chzzk.naver.com/live/99ymxtsjqP",
  ])("공식 클립 주소가 아닌 %s를 거부함", (url) => {
    expect(parseChzzkClipUrl(url)).toBeNull();
  });
});

describe("getChzzkClipEmbedUrl", () => {
  it("검증된 정식 클립 주소만 공식 embed 주소로 변환한다", () => {
    expect(
      getChzzkClipEmbedUrl(
        "https://chzzk.naver.com/clips/Abcd_1234-test",
      ),
    ).toBe("https://chzzk.naver.com/embed/clip/Abcd_1234-test");
    expect(
      getChzzkClipEmbedUrl("https://example.com/clips/Abcd_1234-test"),
    ).toBeNull();
  });
});
