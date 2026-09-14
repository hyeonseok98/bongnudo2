import { describe, expect, it } from "vitest";

import {
  getRpProfileObjectKey,
  getRpProfileUploadPlan,
  parseRpProfileFileName,
} from "../../tools/upload-rp-profile-images.mjs";

describe("RP 프로필 이미지 업로드 계획", () => {
  it("파일명에서 스트리머, RP명, 순번을 읽고 기존 R2 경로 규칙으로 변환함", () => {
    const parsed = parseRpProfileFileName("강지_도현정_1.webp");

    expect(parsed).toEqual({
      extension: "webp",
      order: "1",
      rpName: "도현정",
      streamerName: "강지",
    });
    expect(getRpProfileObjectKey(parsed)).toBe(
      "streamers/강지/rp-profile/도현정_1.webp",
    );
  });

  it("파일명 형식과 참가자 매칭, 기존 사진 키를 안전하게 구분함", async () => {
    const plan = await getRpProfileUploadPlan({
      directoryEntries: [
        createFileEntry("강지_도현정_1.webp"),
        createFileEntry("강지_기존사진_1.webp"),
        createFileEntry("찾을수없음_없는RP_1.webp"),
        createFileEntry("잘못된 파일명.webp"),
        createFileEntry(".gitkeep"),
      ],
      participants: [
        {
          id: "gangji-dohyeonjeong",
          portraitImageKey: null,
          rpName: "도현정",
          streamerName: "강지",
        },
        {
          id: "gangji-existing",
          portraitImageKey: "streamers/강지/rp-profile/기존사진_1.webp",
          rpName: "기존사진",
          streamerName: "강지",
        },
      ],
    });

    expect(plan.uploads).toHaveLength(1);
    expect(plan.skipped).toHaveLength(1);
    expect(plan.unmatchedFiles).toEqual(["찾을수없음_없는RP_1.webp"]);
    expect(plan.invalidFiles).toEqual(["잘못된 파일명.webp"]);
  });
});

function createFileEntry(name: string) {
  return { isFile: () => true, name };
}
