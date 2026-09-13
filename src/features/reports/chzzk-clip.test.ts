import { describe, expect, it } from "vitest";

import { parseChzzkClipUrl } from "./chzzk-clip";

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
