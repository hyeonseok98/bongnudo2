import { afterEach, describe, expect, it, vi } from "vitest";

import {
  REPORT_IMAGE_MIME_TYPE,
  REPORT_IMAGE_UPLOAD_ERROR_MESSAGE,
  type CompressedReportImage,
} from "@/features/reports/report-image";

import { uploadReportImages } from "./report-uploads";

const IMAGE: CompressedReportImage = {
  blob: new Blob(["image"], { type: REPORT_IMAGE_MIME_TYPE }),
  byteSize: 5,
  height: 1,
  mimeType: REPORT_IMAGE_MIME_TYPE,
  width: 1,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("uploadReportImages", () => {
  it("이미지가 없으면 업로드 요청을 보내지 않음", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);

    await expect(uploadReportImages([])).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("서명 URL 준비 요청이 실패하면 관리자 문의 메시지를 반환함", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(uploadReportImages([IMAGE])).rejects.toThrow(
      REPORT_IMAGE_UPLOAD_ERROR_MESSAGE,
    );
  });
});
