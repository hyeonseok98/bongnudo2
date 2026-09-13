import { z } from "zod";

import { parseChzzkClipUrl } from "./chzzk-clip";

export const MAX_REPORT_IMAGE_COUNT = 3;
export const MAX_REPORT_CLIP_COUNT = 5;
export const MAX_REPORT_TAG_COUNT = 10;

const titleSchema = z
  .string()
  .trim()
  .min(1, "제목을 입력해주세요.")
  .max(100, "제목은 100자 이하로 입력해주세요.");

const contentSchema = z
  .string()
  .trim()
  .min(1, "내용을 입력해주세요.")
  .max(200, "내용은 200자 이하로 입력해주세요.");

const imageObjectKeysSchema = z
  .array(z.string().trim().min(1).max(500))
  .max(MAX_REPORT_IMAGE_COUNT, "이미지는 최대 3장까지 등록할 수 있습니다.")
  .refine(hasUniqueValues, "같은 이미지를 중복으로 등록할 수 없습니다.");

const clipUrlSchema = z.string().transform((value, context) => {
  const clip = parseChzzkClipUrl(value);

  if (!clip) {
    context.addIssue({
      code: "custom",
      message: "치지직 공식 클립 주소를 입력해주세요.",
    });
    return z.NEVER;
  }

  return clip.url;
});

const instantDateTimeSchema = z.string().datetime({ offset: true });

const kstDateTimeSchema = z.string().trim().transform((value, context) => {
  const isoString = toKstIsoString(value);

  if (!isoString) {
    context.addIssue({
      code: "custom",
      message: "발생 시간을 확인해주세요.",
    });
    return z.NEVER;
  }

  return isoString;
});

const tagSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/^#+/, "").trim())
  .pipe(
    z
      .string()
      .min(1, "빈 태그는 등록할 수 없습니다.")
      .max(30, "태그는 30자 이하로 입력해주세요."),
  );

const sharedCategoryFields = {
  categoryId: z.uuid("올바른 카테고리를 선택해주세요."),
  title: titleSchema,
  content: contentSchema,
  imageObjectKeys: imageObjectKeysSchema.default([]),
};

const timelineReportSchema = z
  .strictObject({
    reportType: z.literal("timeline"),
    ...sharedCategoryFields,
    occurredAt: kstDateTimeSchema,
    participantIds: z.array(z.uuid()).default([]),
    tags: z
      .array(tagSchema)
      .max(MAX_REPORT_TAG_COUNT, "태그는 최대 10개까지 등록할 수 있습니다.")
      .default([]),
    clipUrls: z
      .array(clipUrlSchema)
      .max(MAX_REPORT_CLIP_COUNT, "클립은 최대 5개까지 등록할 수 있습니다.")
      .default([]),
    confirmations: z.strictObject({
      isRespectful: z.literal(true, {
        error: "필수 확인 항목에 동의해주세요.",
      }),
      canUseAsRecord: z.literal(true, {
        error: "필수 확인 항목에 동의해주세요.",
      }),
    }),
  })
  .superRefine((value, context) => {
    addDuplicateIssue(
      value.participantIds,
      "같은 인물을 중복으로 선택할 수 없습니다.",
      ["participantIds"],
      context,
    );
    addDuplicateIssue(
      value.tags.map((tag) => tag.toLocaleLowerCase("ko-KR")),
      "같은 태그를 중복으로 선택할 수 없습니다.",
      ["tags"],
      context,
    );
    addDuplicateIssue(
      value.clipUrls,
      "같은 클립을 중복으로 등록할 수 없습니다.",
      ["clipUrls"],
      context,
    );
  });

const bugReportSchema = z.strictObject({
  reportType: z.literal("bug"),
  ...sharedCategoryFields,
});

const ideaReportSchema = z.strictObject({
  reportType: z.literal("idea"),
  ...sharedCategoryFields,
});

const correctionReportSchema = z.strictObject({
  reportType: z.literal("correction"),
  timelineEventId: z.uuid("수정할 타임라인을 선택해주세요."),
  title: titleSchema,
  content: contentSchema,
});

export const reportRequestSchema = z.discriminatedUnion("reportType", [
  timelineReportSchema,
  bugReportSchema,
  ideaReportSchema,
  correctionReportSchema,
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

function toKstIsoString(value: string): string | null {
  const instantResult = instantDateTimeSchema.safeParse(value);

  if (instantResult.success) {
    return new Date(instantResult.data).toISOString();
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
    value,
  );

  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second = "00"] = match;
  const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}+09:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
  const normalized = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;

  return normalized === `${year}-${month}-${day}T${hour}:${minute}:${second}`
    ? date.toISOString()
    : null;
}

function hasUniqueValues(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

function addDuplicateIssue(
  values: readonly string[],
  message: string,
  path: PropertyKey[],
  context: z.RefinementCtx,
): void {
  if (!hasUniqueValues(values)) {
    context.addIssue({ code: "custom", message, path });
  }
}
