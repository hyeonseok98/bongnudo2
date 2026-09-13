import { NextResponse } from "next/server";
import { z } from "zod";

import { MAX_REPORT_IMAGE_BYTES } from "@/features/reports/report-image";
import {
  MAX_REPORT_IMAGE_COUNT,
  ReportRequestError,
} from "@/features/reports/report-validation";
import { requireReportUser } from "@/features/reports/report-user";
import { prepareReportImageUpload } from "@/lib/r2-server";

const uploadRequestSchema = z.strictObject({
  files: z
    .array(
      z.strictObject({
        byteSize: z
          .number()
          .int()
          .positive()
          .max(MAX_REPORT_IMAGE_BYTES),
      }),
    )
    .min(1)
    .max(MAX_REPORT_IMAGE_COUNT),
});

export async function POST(request: Request) {
  try {
    const user = await requireReportUser();
    const body: unknown = await request.json();
    const parsed = uploadRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw new ReportRequestError("업로드할 이미지를 확인해주세요.");
    }

    const uploads = await Promise.all(
      parsed.data.files.map(() => prepareReportImageUpload(user.id)),
    );

    return NextResponse.json({ uploads });
  } catch (error) {
    if (error instanceof ReportRequestError) {
      if (error.status >= 500) {
        console.error("Failed to prepare report uploads", error);
      }

      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("Failed to prepare report uploads", error);
    return NextResponse.json(
      { error: "이미지 업로드를 준비하지 못했습니다." },
      { status: 500 },
    );
  }
}
