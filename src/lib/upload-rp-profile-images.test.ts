import { describe, expect, it } from "vitest";

import {
  getRpProfileObjectKey,
  getRpProfileUploadPlan,
  parseRpProfileFileName,
} from "../../tools/upload-rp-profile-images.mjs";

describe("RP 프로필 이미지 업로드 계획", () => {
  it("RP명과 순번을 읽어 DB의 스트리머명 기준 R2 경로로 변환함", () => {
    const parsed = parseRpProfileFileName("도현정_1.webp");

    expect(parsed).toEqual({
      extension: "webp",
      imageType: "portrait",
      order: "1",
      rpName: "도현정",
    });
    expect(getRpProfileObjectKey({ ...parsed, streamerName: "강지" })).toBe(
      "streamers/강지/rp-profile/도현정_1.webp",
    );
  });

  it("전신 사진 형식을 구분해 별도 R2 키로 변환함", () => {
    const parsed = parseRpProfileFileName("도현정_full_1.png");

    expect(parsed).toEqual({
      extension: "png",
      imageType: "full",
      order: "1",
      rpName: "도현정",
    });
    expect(getRpProfileObjectKey({ ...parsed, streamerName: "강지" })).toBe(
      "streamers/강지/rp-profile/도현정_full_1.png",
    );
  });

  it("파일명 형식과 참가자 매칭, 기존 사진 키를 안전하게 구분함", async () => {
    const plan = await getRpProfileUploadPlan({
      directoryEntries: [
        createFileEntry("도현정_1.webp"),
        createFileEntry("도현정_full_1.webp"),
        createFileEntry("기존사진_1.webp"),
        createFileEntry("없는RP_1.webp"),
        createFileEntry("잘못된 파일명.webp"),
        createFileEntry(".gitkeep"),
      ],
      participants: [
        {
          id: "gangji-dohyeonjeong",
          fullBodyImageKey: null,
          portraitImageKey: null,
          rpName: "도현정",
          streamerName: "강지",
        },
        {
          id: "gangji-existing",
          fullBodyImageKey: null,
          portraitImageKey: "streamers/강지/rp-profile/기존사진_1.webp",
          rpName: "기존사진",
          streamerName: "강지",
        },
      ],
    });

    expect(plan.uploads).toHaveLength(2);
    expect(plan.uploads).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fileName: "도현정_1.webp",
          imageField: "portraitImageKey",
          objectKey: "streamers/강지/rp-profile/도현정_1.webp",
        }),
        expect.objectContaining({
          fileName: "도현정_full_1.webp",
          imageField: "fullBodyImageKey",
          objectKey: "streamers/강지/rp-profile/도현정_full_1.webp",
        }),
      ]),
    );
    expect(plan.skipped).toHaveLength(1);
    expect(plan.unmatchedFiles).toEqual(["없는RP_1.webp"]);
    expect(plan.invalidFiles).toEqual(["잘못된 파일명.webp"]);
  });
});

function createFileEntry(name: string) {
  return { isFile: () => true, name };
}
