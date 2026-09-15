import { validateReportImageFiles } from "./report-image";
import {
  MAX_REPORT_IMAGE_COUNT,
  validateReportRequest,
  type ReportRequest,
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

export interface ReportFormState {
  confirmations: Record<UserReportType, ReportConfirmations>;
  drafts: Record<UserReportType, ReportDraft>;
  files: File[];
  reportType: UserReportType;
}

export interface ReportFormErrors {
  categoryId?: string;
  confirmations?: string;
  content?: string;
  images?: string;
  title?: string;
}

const EMPTY_CONFIRMATIONS: ReportConfirmations = {
  canUseAsRecord: false,
  isRespectful: false,
};

function createEmptyDraft(): ReportDraft {
  return { categoryId: "", content: "", title: "" };
}

export function createInitialReportForm(): ReportFormState {
  return {
    confirmations: {
      bug: { ...EMPTY_CONFIRMATIONS },
      idea: { ...EMPTY_CONFIRMATIONS },
    },
    drafts: {
      bug: createEmptyDraft(),
      idea: createEmptyDraft(),
    },
    files: [],
    reportType: "bug",
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
  else if (draft.title.length > 100) {
    errors.title = "제목은 100자 이하로 입력해주세요.";
  }
  if (!draft.content.trim()) errors.content = "내용을 입력해주세요.";
  else if (draft.content.length > 400) {
    errors.content = "내용은 400자 이하로 입력해주세요.";
  }
  if (!confirmations.isRespectful || !confirmations.canUseAsRecord) {
    errors.confirmations = "필수 확인 항목에 모두 동의해주세요.";
  }

  try {
    validateReportImageFiles(state.files);
  } catch (error) {
    errors.images =
      error instanceof Error ? error.message : "이미지를 확인해주세요.";
  }

  return errors;
}

export function isReportFormReady(state: ReportFormState): boolean {
  const draft = getActiveReportDraft(state);
  const confirmations = state.confirmations[state.reportType];

  return Boolean(
    draft.categoryId &&
      draft.title.trim() &&
      draft.content.trim() &&
      confirmations.isRespectful &&
      confirmations.canUseAsRecord,
  );
}

export function buildReportRequest(
  state: ReportFormState,
  imageObjectKeys: string[],
): ReportRequest {
  const draft = getActiveReportDraft(state);

  return validateReportRequest({
    reportType: state.reportType,
    categoryId: draft.categoryId,
    content: draft.content,
    imageObjectKeys,
    title: draft.title,
  });
}

export { MAX_REPORT_IMAGE_COUNT };
