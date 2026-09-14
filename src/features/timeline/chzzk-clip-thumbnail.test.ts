import { describe, expect, it } from "vitest";

import { extractChzzkClipThumbnail } from "./chzzk-clip-thumbnail";

describe("extractChzzkClipThumbnail", () => {
  it("CHZZK 페이지의 Open Graph 이미지 주소를 추출함", () => {
    expect(
      extractChzzkClipThumbnail(
        '<meta content="https://ssl.pstatic.net/clip.webp?type=a&amp;width=640" property="og:image">',
      ),
    ).toBe("https://ssl.pstatic.net/clip.webp?type=a&width=640");
  });

  it("메타데이터가 없거나 안전한 이미지 URL이 아니면 fallback을 사용함", () => {
    expect(extractChzzkClipThumbnail("<html></html>")).toBeNull();
    expect(
      extractChzzkClipThumbnail(
        '<meta property="og:image" content="javascript:alert(1)">',
      ),
    ).toBeNull();
  });
});
