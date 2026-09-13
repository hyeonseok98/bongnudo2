import type { ReportParticipantSearchResult } from "./search-report-participants";
import { parseChzzkClipUrl } from "./chzzk-clip";
import { validateReportImageFiles } from "./report-image";
import type { ReportRequest } from "./report-validation";
import {
  MAX_REPORT_CLIP_COUNT,
  MAX_REPORT_IMAGE_COUNT,
  validateReportRequest,
} from "./report-validation";
import type { UserReportType } from "./report-options";

export interface ReportConfirmations {
  canUseAsRecord: boolean;
  isNotDuplicate: boolean;
  isRespectful: boolean;
}

export interface ReportFormState {
  categoryId: string;
  clipUrls: string[];
  confirmations: ReportConfirmations;
  content: string;
  files: File[];
  occurredDate: string;
  occurredTime: string;
  participants: ReportParticipantSearchResult[];
  reportType: UserReportType;
  tagIds: string[];
  title: string;
}

export function createInitialReportForm(today: string): ReportFormState {
  return {
    categoryId: "",
    clipUrls: [""],
    confirmations: {
      canUseAsRecord: false,
      isNotDuplicate: false,
      isRespectful: false,
    },
    content: "",
    files: [],
    occurredDate: today,
    occurredTime: "12:00",
    participants: [],
    reportType: "timeline",
    tagIds: [],
    title: "",
  };
}

export function validateReportForm(state: ReportFormState): string | null {
  if (!state.categoryId) return "분류를 선택해주세요.";
  if (!state.title.trim()) return "제목을 입력해주세요.";
  if (state.title.trim().length > 100)
    return "제목은 100자 이하로 입력해주세요.";
  if (!state.content.trim()) return "내용을 입력해주세요.";
  if (state.content.trim().length > 200)
    return "내용은 200자 이하로 입력해주세요.";
  if (!state.confirmations.isRespectful || !state.confirmations.canUseAsRecord)
    return "필수 확인 항목에 동의해주세요.";

  if (state.reportType === "timeline") {
    if (!state.occurredDate || !state.occurredTime)
      return "발생 시간을 확인해주세요.";
    if (!state.confirmations.isNotDuplicate)
      return "필수 확인 항목에 동의해주세요.";

    const normalizedClips = normalizeClipUrls(state.clipUrls);
    if (normalizedClips.error) return normalizedClips.error;
  }

  try {
    validateReportImageFiles(state.files);
  } catch (error) {
    return error instanceof Error ? error.message : "이미지를 확인해주세요.";
  }

  return null;
}

export function buildReportRequest(
  state: ReportFormState,
  imageObjectKeys: string[],
): ReportRequest {
  const shared = {
    categoryId: state.categoryId,
    content: state.content,
    imageObjectKeys,
    title: state.title,
  };

  if (state.reportType === "bug" || state.reportType === "idea") {
    return validateReportRequest({ reportType: state.reportType, ...shared });
  }

  const normalizedClips = normalizeClipUrls(state.clipUrls);
  if (normalizedClips.error) throw new Error(normalizedClips.error);

  return validateReportRequest({
    reportType: "timeline",
    ...shared,
    clipUrls: normalizedClips.urls,
    confirmations: {
      canUseAsRecord: true,
      isNotDuplicate: true,
      isRespectful: true,
    },
    occurredAt: `${state.occurredDate}T${state.occurredTime}`,
    participantIds: state.participants.map(
      (participant) => participant.seasonParticipantId,
    ),
    tagIds: state.tagIds,
  });
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

function normalizeClipUrls(
  values: readonly string[],
): { error: string | null; urls: string[] } {
  const enteredValues = values.map((value) => value.trim()).filter(Boolean);
  if (enteredValues.length > MAX_REPORT_CLIP_COUNT) {
    return { error: "클립은 최대 5개까지 등록할 수 있습니다.", urls: [] };
  }

  const clips = enteredValues.map(parseChzzkClipUrl);
  if (clips.some((clip) => clip === null)) {
    return { error: "CHZZK 공식 클립 주소를 입력해주세요.", urls: [] };
  }

  const urls = clips.flatMap((clip) => (clip ? [clip.url] : []));
  if (new Set(urls).size !== urls.length) {
    return { error: "같은 클립을 중복으로 등록할 수 없습니다.", urls: [] };
  }

  return { error: null, urls };
}

export { MAX_REPORT_CLIP_COUNT, MAX_REPORT_IMAGE_COUNT };
