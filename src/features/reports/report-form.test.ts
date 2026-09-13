import { describe, expect, it } from "vitest";

import {
  buildCorrectionRequest,
  buildReportRequest,
  createInitialReportForm,
  getReportClipErrors,
  isReportFormReady,
  validateReportForm,
} from "./report-form";

const CATEGORY_ID = "9b544faa-9a71-4568-b04f-394dbaa738b0";
const EVENT_ID = "338e3f7f-455e-41cb-a857-d69e54ff8a67";

function createValidForm() {
  const initial = createInitialReportForm("2026-09-13");
  return {
    ...initial,
    confirmations: {
      ...initial.confirmations,
      timeline: {
        canUseAsRecord: true,
        isNotDuplicate: true,
        isRespectful: true,
      },
    },
    drafts: {
      ...initial.drafts,
      timeline: {
        categoryId: CATEGORY_ID,
        content: "자세한 제보 내용",
        title: "제보 제목",
      },
    },
  };
}

describe("report form", () => {
  it("타임라인 제보에 발생 시각과 필수 확인을 포함함", () => {
    const request = buildReportRequest(createValidForm(), []);
    expect(request.reportType).toBe("timeline");
    expect(request).toMatchObject({
      occurredAt: "2026-09-13T03:00:00.000Z",
      participantIds: [],
      tagIds: [],
    });
  });

  it.each(["bug", "idea"] as const)(
    "%s 제보에는 타임라인 전용 필드를 전송하지 않음",
    (reportType) => {
      const form = createValidForm();
      const request = buildReportRequest(
        {
          ...form,
          confirmations: {
            ...form.confirmations,
            [reportType]: {
              canUseAsRecord: true,
              isNotDuplicate: false,
              isRespectful: true,
            },
          },
          drafts: {
            ...form.drafts,
            [reportType]: form.drafts.timeline,
          },
          reportType,
        },
        ["timeline/tmp/user/image.webp"],
      );
      expect(request).toEqual({
        categoryId: CATEGORY_ID,
        content: "자세한 제보 내용",
        imageObjectKeys: ["timeline/tmp/user/image.webp"],
        reportType,
        title: "제보 제목",
      });
    },
  );

  it("중복 CHZZK 클립을 제출 전에 차단함", () => {
    const url = "https://chzzk.naver.com/clips/abcdef";
    expect(
      validateReportForm({
        ...createValidForm(),
        clipFields: [
          { id: "first", value: url },
          { id: "second", value: url },
        ],
      }),
    ).toBe("같은 클립을 중복으로 등록할 수 없습니다.");
  });

  it("클립 오류를 각 입력 필드에 연결함", () => {
    expect(
      getReportClipErrors([
        { id: "valid", value: "https://chzzk.naver.com/clips/abcdef" },
        { id: "invalid", value: "https://example.com/video" },
      ]),
    ).toEqual({ invalid: "CHZZK 공식 클립 주소를 입력해주세요." });
  });

  it("현재 유형의 필수 입력과 동의가 완료되어야 제출 가능함", () => {
    const validForm = createValidForm();
    expect(isReportFormReady(validForm)).toBe(true);
    expect(
      isReportFormReady({
        ...validForm,
        drafts: {
          ...validForm.drafts,
          timeline: { ...validForm.drafts.timeline, title: "" },
        },
      }),
    ).toBe(false);
  });

  it("제보 유형별 작성 내용을 독립적으로 유지함", () => {
    const form = createValidForm();
    expect(form.drafts.timeline.title).toBe("제보 제목");
    expect(form.drafts.bug.title).toBe("");
    expect(form.clipFields).toEqual([{ id: "clip-initial", value: "" }]);
  });

  it("정정 요청은 대상 이벤트와 100자 이내 제목을 사용함", () => {
    const request = buildCorrectionRequest(EVENT_ID, "사건 제목", "수정 내용");
    expect(request).toEqual({
      content: "수정 내용",
      reportType: "correction",
      timelineEventId: EVENT_ID,
      title: "사건 제목 수정 요청",
    });
  });
});
