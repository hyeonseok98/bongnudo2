import { describe, expect, it } from "vitest";

import {
  getReportImageDimensions,
  MAX_REPORT_IMAGE_BYTES,
  validateReportImageFiles,
} from "./report-image";

describe("report image validation", () => {
  it("JPG, PNG, WEBP 파일을 허용함", () => {
    expect(() =>
      validateReportImageFiles([
        { type: "image/jpeg", size: 100 },
        { type: "image/png", size: 200 },
        { type: "image/webp", size: 300 },
      ]),
    ).not.toThrow();
  });

  it("GIF와 10MB 초과 파일을 거부함", () => {
    expect(() =>
      validateReportImageFiles([{ type: "image/gif", size: 100 }]),
    ).toThrow("JPG, PNG, WEBP 이미지만 등록할 수 있습니다.");
    expect(() =>
      validateReportImageFiles([
        { type: "image/png", size: MAX_REPORT_IMAGE_BYTES + 1 },
      ]),
    ).toThrow("이미지는 파일당 10MB 이하로 등록해주세요.");
  });

  it("이미지 5개까지 허용하고 6개부터 거부함", () => {
    const images = Array.from({ length: 5 }, () => ({
      type: "image/png",
      size: 100,
    }));

    expect(() => validateReportImageFiles(images)).not.toThrow();
    expect(() =>
      validateReportImageFiles([...images, { type: "image/png", size: 100 }]),
    ).toThrow("이미지는 최대 5장까지 등록할 수 있습니다.");
  });

  it("긴 변만 2560px로 줄이고 작은 이미지는 확대하지 않음", () => {
    expect(getReportImageDimensions(4000, 2000)).toEqual({
      width: 2560,
      height: 1280,
    });
    expect(getReportImageDimensions(1200, 800)).toEqual({
      width: 1200,
      height: 800,
    });
  });
});
