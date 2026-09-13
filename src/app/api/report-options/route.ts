import { NextResponse } from "next/server";

import { getReportOptions } from "@/features/reports/get-report-options";

export async function GET() {
  try {
    return NextResponse.json(await getReportOptions());
  } catch (error) {
    console.error("Failed to load report options", error);

    return NextResponse.json(
      { error: "제보 선택 항목을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
