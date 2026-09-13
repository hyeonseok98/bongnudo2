import { describe, expect, it } from "vitest";

import {
  ReportRequestError,
  validateReportRequest,
} from "./report-validation";

const CATEGORY_ID = "00000000-0000-4000-8000-000000000001";
const PARTICIPANT_ID = "00000000-0000-4000-8000-000000000002";
const TAG_ID = "00000000-0000-4000-8000-000000000003";

describe("validateReportRequest", () => {
  it("timeline 제보의 KST 시각과 클립 주소를 정규화함", () => {
    const result = validateReportRequest({
      reportType: "timeline",
      categoryId: CATEGORY_ID,
      title: "도시의 사건",
      content: "사건이 발생했습니다.",
      occurredAt: "2026-09-13T10:30",
      participantIds: [PARTICIPANT_ID],
      tagIds: [TAG_ID],
      imageObjectKeys: [],
      clipUrls: ["https://chzzk.naver.com/clips/99ymxtsjqP?share=1"],
      confirmations: {
        isNotDuplicate: true,
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

  it("중복 participant를 거부함", () => {
    expect(() =>
      validateReportRequest({
        reportType: "timeline",
        categoryId: CATEGORY_ID,
        title: "도시의 사건",
        content: "사건이 발생했습니다.",
        occurredAt: "2026-09-13T10:30",
        participantIds: [PARTICIPANT_ID, PARTICIPANT_ID],
        tagIds: [],
        imageObjectKeys: [],
        clipUrls: [],
        confirmations: {
          isNotDuplicate: true,
          isRespectful: true,
          canUseAsRecord: true,
        },
      }),
    ).toThrowError("같은 인물을 중복으로 선택할 수 없습니다.");
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
