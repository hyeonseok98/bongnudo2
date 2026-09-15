import { z } from "zod";

export const MAX_REPORT_IMAGE_COUNT = 5;

const titleSchema = z
  .string()
  .trim()
  .min(1, "제목을 입력해주세요.")
  .max(100, "제목은 100자 이하로 입력해주세요.");

const contentSchema = z
  .string()
  .trim()
  .min(1, "내용을 입력해주세요.")
  .max(400, "내용은 400자 이하로 입력해주세요.");

const imageObjectKeysSchema = z
  .array(z.string().trim().min(1).max(500))
  .max(MAX_REPORT_IMAGE_COUNT, "이미지는 최대 5장까지 등록할 수 있습니다.")
  .refine(hasUniqueValues, "같은 이미지를 중복으로 등록할 수 없습니다.");

const sharedCategoryFields = {
  categoryId: z.uuid("올바른 카테고리를 선택해주세요."),
  title: titleSchema,
  content: contentSchema,
  imageObjectKeys: imageObjectKeysSchema.default([]),
};

const bugReportSchema = z.strictObject({
  reportType: z.literal("bug"),
  ...sharedCategoryFields,
});

const ideaReportSchema = z.strictObject({
  reportType: z.literal("idea"),
  ...sharedCategoryFields,
});

export const reportRequestSchema = z.discriminatedUnion("reportType", [
  bugReportSchema,
  ideaReportSchema,
]);

export type ReportRequest = z.input<typeof reportRequestSchema>;
export type ValidatedReportRequest = z.output<typeof reportRequestSchema>;

export class ReportRequestError extends Error {
  constructor(
    message: string,
    readonly status: number = 400,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ReportRequestError";
  }
}

export function validateReportRequest(value: unknown): ValidatedReportRequest {
  const result = reportRequestSchema.safeParse(value);

  if (!result.success) {
    throw new ReportRequestError(
      result.error.issues[0]?.message ?? "제보 내용을 확인해주세요.",
    );
  }

  return result.data;
}

function hasUniqueValues(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}
