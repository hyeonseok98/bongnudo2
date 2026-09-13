import type { ReportParticipantSearchResult } from "./search-report-participants";
import { parseChzzkClipUrl } from "./chzzk-clip";
import { validateReportImageFiles } from "./report-image";
import type { ReportRequest } from "./report-validation";
import {
  MAX_REPORT_CLIP_COUNT,
  MAX_REPORT_IMAGE_COUNT,
  MAX_REPORT_TAG_COUNT,
  validateReportRequest,
} from "./report-validation";
import type { UserReportType } from "./report-options";

export interface ReportConfirmations {
  canUseAsRecord: boolean;
  isRespectful: boolean;
}

export interface ReportDraft {
  categoryId: string;
  content: string;
  title: string;
}

export interface ReportClipField {
  id: string;
  value: string;
}

export interface ReportFormState {
  clipFields: ReportClipField[];
  confirmations: Record<UserReportType, ReportConfirmations>;
  drafts: Record<UserReportType, ReportDraft>;
  files: File[];
  occurredDate: string;
  occurredTime: string;
  participants: ReportParticipantSearchResult[];
  reportType: UserReportType;
  tags: string[];
}

export interface ReportFormErrors {
  categoryId?: string;
  clips?: Record<string, string>;
  confirmations?: string;
  content?: string;
  images?: string;
  occurredAt?: string;
  title?: string;
}

const EMPTY_CONFIRMATIONS: ReportConfirmations = {
  canUseAsRecord: false,
  isRespectful: false,
};

function createEmptyDraft(): ReportDraft {
  return { categoryId: "", content: "", title: "" };
}

export function createInitialReportForm(today: string): ReportFormState {
  return {
    clipFields: [{ id: "clip-initial", value: "" }],
    confirmations: {
      bug: { ...EMPTY_CONFIRMATIONS },
      idea: { ...EMPTY_CONFIRMATIONS },
      timeline: { ...EMPTY_CONFIRMATIONS },
    },
    drafts: {
      bug: createEmptyDraft(),
      idea: createEmptyDraft(),
      timeline: createEmptyDraft(),
    },
    files: [],
    occurredDate: today,
    occurredTime: "12:00",
    participants: [],
    reportType: "timeline",
    tags: [],
  };
}

export function getActiveReportDraft(state: ReportFormState): ReportDraft {
  return state.drafts[state.reportType];
}

export function getReportFormErrors(state: ReportFormState): ReportFormErrors {
  const errors: ReportFormErrors = {};
  const draft = getActiveReportDraft(state);
  const confirmations = state.confirmations[state.reportType];

  if (!draft.categoryId) errors.categoryId = "분류를 선택해주세요.";
  if (!draft.title.trim()) errors.title = "제목을 입력해주세요.";
  else if (draft.title.length > 100)
    errors.title = "제목은 100자 이하로 입력해주세요.";
  if (!draft.content.trim()) errors.content = "내용을 입력해주세요.";
  else if (draft.content.length > 200)
    errors.content = "내용은 200자 이하로 입력해주세요.";
  if (!confirmations.isRespectful || !confirmations.canUseAsRecord)
    errors.confirmations = "필수 확인 항목에 모두 동의해주세요.";

  if (state.reportType === "timeline") {
    if (!state.occurredDate || !state.occurredTime)
      errors.occurredAt = "발생 시간을 확인해주세요.";
    const clipErrors = getReportClipErrors(state.clipFields);
    if (Object.keys(clipErrors).length > 0) errors.clips = clipErrors;
  }

  try {
    validateReportImageFiles(state.files);
  } catch (error) {
    errors.images =
      error instanceof Error ? error.message : "이미지를 확인해주세요.";
  }

  return errors;
}

export function validateReportForm(state: ReportFormState): string | null {
  const errors = getReportFormErrors(state);
  return (
    errors.categoryId ??
    errors.title ??
    errors.content ??
    errors.occurredAt ??
    errors.confirmations ??
    errors.images ??
    Object.values(errors.clips ?? {})[0] ??
    null
  );
}

export function isReportFormReady(state: ReportFormState): boolean {
  const draft = getActiveReportDraft(state);
  const confirmations = state.confirmations[state.reportType];

  return Boolean(
    draft.categoryId &&
      draft.title.trim() &&
      draft.content.trim() &&
      confirmations.isRespectful &&
      confirmations.canUseAsRecord &&
      (state.reportType !== "timeline" ||
        (state.occurredDate && state.occurredTime)),
  );
}

export function getReportClipErrors(
  fields: readonly ReportClipField[],
): Record<string, string> {
  const errors: Record<string, string> = {};
  const normalizedUrls = new Map<string, string[]>();

  if (fields.length > MAX_REPORT_CLIP_COUNT) {
    const lastField = fields.at(-1);
    if (lastField)
      errors[lastField.id] = "클립은 최대 5개까지 등록할 수 있습니다.";
  }

  for (const field of fields) {
    const value = field.value.trim();
    if (!value) continue;

    const clip = parseChzzkClipUrl(value);
    if (!clip) {
      errors[field.id] = "치지직 공식 클립 주소를 입력해주세요.";
      continue;
    }

    normalizedUrls.set(clip.url, [
      ...(normalizedUrls.get(clip.url) ?? []),
      field.id,
    ]);
  }

  for (const fieldIds of normalizedUrls.values()) {
    if (fieldIds.length < 2) continue;
    for (const fieldId of fieldIds) {
      errors[fieldId] = "같은 클립을 중복으로 등록할 수 없습니다.";
    }
  }

  return errors;
}

export function buildReportRequest(
  state: ReportFormState,
  imageObjectKeys: string[],
): ReportRequest {
  const draft = getActiveReportDraft(state);
  const shared = {
    categoryId: draft.categoryId,
    content: draft.content,
    imageObjectKeys,
    title: draft.title,
  };

  if (state.reportType === "bug" || state.reportType === "idea") {
    return validateReportRequest({ reportType: state.reportType, ...shared });
  }

  return validateReportRequest({
    reportType: "timeline",
    ...shared,
    clipUrls: normalizeClipUrls(state.clipFields),
    confirmations: {
      canUseAsRecord: true,
      isRespectful: true,
    },
    occurredAt: `${state.occurredDate}T${state.occurredTime}`,
    participantIds: state.participants.map(
      (participant) => participant.seasonParticipantId,
    ),
    tags: state.tags,
  });
}

export function normalizeReportTag(value: string): string {
  return value.trim().replace(/^#+/, "").trim();
}

export function addReportTag(tags: readonly string[], value: string): string[] {
  const tag = normalizeReportTag(value);
  if (!tag) return [...tags];

  const normalizedTag = tag.toLocaleLowerCase("ko-KR");
  if (
    tags.some(
      (candidate) =>
        candidate.toLocaleLowerCase("ko-KR") === normalizedTag,
    )
  ) {
    return [...tags];
  }

  return [...tags, tag];
}

export function removeReportClipField(
  fields: readonly ReportClipField[],
  fieldId: string,
): ReportClipField[] {
  if (fields.length <= 1) return [...fields];
  return fields.filter((field) => field.id !== fieldId);
}

export function buildCorrectionRequest(
  eventId: string,
  eventTitle: string,
  content: string,
): ReportRequest {
  return validateReportRequest({
    reportType: "correction",
    timelineEventId: eventId,
    title: `${eventTitle} 수정 요청`.slice(0, 100),
    content,
  });
}

function normalizeClipUrls(fields: readonly ReportClipField[]): string[] {
  const errors = getReportClipErrors(fields);
  const firstError = Object.values(errors)[0];
  if (firstError) throw new Error(firstError);

  return fields.flatMap((field) => {
    const clip = parseChzzkClipUrl(field.value.trim());
    return clip ? [clip.url] : [];
  });
}

export {
  MAX_REPORT_CLIP_COUNT,
  MAX_REPORT_IMAGE_COUNT,
  MAX_REPORT_TAG_COUNT,
};
