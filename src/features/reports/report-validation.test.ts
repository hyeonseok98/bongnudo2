import { describe, expect, it } from "vitest";

import {
  ReportRequestError,
  validateReportRequest,
} from "./report-validation";

const CATEGORY_ID = "00000000-0000-4000-8000-000000000001";
const PARTICIPANT_ID = "00000000-0000-4000-8000-000000000002";

describe("validateReportRequest", () => {
  it("timeline 제보의 KST 시각과 클립 주소를 정규화함", () => {
    const result = validateReportRequest({
      reportType: "timeline",
      categoryId: CATEGORY_ID,
      title: "도시의 사건",
      content: "사건이 발생했습니다.",
      occurredAt: "2026-09-13T10:30",
      participantIds: [PARTICIPANT_ID],
      tags: ["경찰"],
      imageObjectKeys: [],
      clipUrls: ["https://chzzk.naver.com/clips/99ymxtsjqP?share=1"],
      confirmations: {
        isRespectful: true,
        canUseAsRecord: true,
      },
    });

    expect(result.reportType).toBe("timeline");
    expect(result.occurredAt).toBe("2026-09-13T01:30:00.000Z");
    expect(result.clipUrls).toEqual([
      "https://chzzk.naver.com/clips/99ymxtsjqP",
    ]);
  });

  it("정규화된 timeline 제보를 서버에서 다시 검증할 수 있음", () => {
    const clientResult = validateReportRequest({
      reportType: "timeline",
      categoryId: CATEGORY_ID,
      title: "도시의 사건",
      content: "사건이 발생했습니다.",
      occurredAt: "2026-09-13T10:30",
      participantIds: [PARTICIPANT_ID],
      tags: [],
      imageObjectKeys: [],
      clipUrls: [],
      confirmations: {
        isRespectful: true,
        canUseAsRecord: true,
      },
    });

    const serverResult = validateReportRequest(clientResult);

    expect(serverResult.occurredAt).toBe("2026-09-13T01:30:00.000Z");
  });

  it("중복 participant를 거부함", () => {
    expect(() =>
      validateReportRequest({
        reportType: "timeline",
        categoryId: CATEGORY_ID,
        title: "도시의 사건",
        content: "사건이 발생했습니다.",
        occurredAt: "2026-09-13T10:30",
        participantIds: [PARTICIPANT_ID, PARTICIPANT_ID],
        tags: [],
        imageObjectKeys: [],
        clipUrls: [],
        confirmations: {
          isRespectful: true,
          canUseAsRecord: true,
        },
      }),
    ).toThrowError("같은 인물을 중복으로 선택할 수 없습니다.");
  });

  it("타임라인 제보에 관련 인물을 필수로 요구함", () => {
    expect(() =>
      validateReportRequest({
        reportType: "timeline",
        categoryId: CATEGORY_ID,
        title: "도시의 사건",
        content: "사건이 발생했습니다.",
        occurredAt: "2026-09-13T10:30",
        participantIds: [],
        tags: [],
        imageObjectKeys: [],
        clipUrls: [],
        confirmations: { isRespectful: true, canUseAsRecord: true },
      }),
    ).toThrowError("관련 인물을 한 명 이상 선택해주세요.");
  });

  it("본문 400자와 이미지 5개를 허용하고 한도를 넘으면 거부함", () => {
    const base = {
      reportType: "timeline" as const,
      categoryId: CATEGORY_ID,
      title: "도시의 사건",
      occurredAt: "2026-09-13T10:30",
      participantIds: [PARTICIPANT_ID],
      tags: [],
      clipUrls: [],
      confirmations: {
        isRespectful: true as const,
        canUseAsRecord: true as const,
      },
    };

    expect(
      validateReportRequest({
        ...base,
        content: "가".repeat(400),
        imageObjectKeys: ["1", "2", "3", "4", "5"],
      }).content,
    ).toHaveLength(400);
    expect(() =>
      validateReportRequest({
        ...base,
        content: "가".repeat(401),
        imageObjectKeys: [],
      }),
    ).toThrowError("내용은 400자 이하로 입력해주세요.");
    expect(() =>
      validateReportRequest({
        ...base,
        content: "내용",
        imageObjectKeys: ["1", "2", "3", "4", "5", "6"],
      }),
    ).toThrowError("이미지는 최대 5장까지 등록할 수 있습니다.");
  });

  it("timeline 전용 필드를 bug 제보에서 거부함", () => {
    expect(() =>
      validateReportRequest({
        reportType: "bug",
        categoryId: CATEGORY_ID,
        title: "오류",
        content: "화면 오류가 있습니다.",
        imageObjectKeys: [],
        occurredAt: "2026-09-13T10:30",
      }),
    ).toThrow(ReportRequestError);
  });
});
