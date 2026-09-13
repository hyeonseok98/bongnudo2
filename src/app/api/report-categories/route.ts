import { NextResponse } from "next/server";

import { getTimelineReportCategories } from "@/features/reports/get-report-categories";

export async function GET() {
  try {
    const categories = await getTimelineReportCategories();

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Failed to load report categories", error);

    return NextResponse.json(
      { error: "제보 분류를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
