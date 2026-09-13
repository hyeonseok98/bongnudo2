import { NextResponse } from "next/server";

import { createReport } from "@/features/reports/create-report";
import { ReportRequestError } from "@/features/reports/report-validation";
import { requireReportUser } from "@/features/reports/report-user";

export async function POST(request: Request) {
  try {
    const user = await requireReportUser();
    const body: unknown = await request.json();
    const report = await createReport(user, body);

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    return createErrorResponse(error, "제보를 저장하지 못했습니다.");
  }
}

function createErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof ReportRequestError) {
    if (error.status >= 500) {
      console.error("Failed to create report", error);
    }

    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }

  console.error("Failed to create report", error);
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
