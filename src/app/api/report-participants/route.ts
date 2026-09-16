import { NextResponse } from "next/server";

import { ReportRequestError } from "@/features/reports/report-validation";
import { searchReportParticipants } from "@/features/reports/search-report-participants";

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams.get("query") ?? "";
    const participants = await searchReportParticipants(query);

    return NextResponse.json({ participants });
  } catch (error) {
    if (error instanceof ReportRequestError) {
      if (error.status >= 500) {
        console.error("Failed to search report participants", error);
      }

      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("Failed to search report participants", error);
    return NextResponse.json(
      { error: "인물 검색에 실패했습니다." },
      { status: 500 },
    );
  }
}
