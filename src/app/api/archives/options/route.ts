import { NextResponse } from "next/server";

import { createArchiveErrorResponse } from "@/features/archives/archive-route";
import { getArchiveEditorOptions } from "@/features/archives/archive-service";

export async function GET() {
  try {
    const options = await getArchiveEditorOptions();

    return NextResponse.json(options, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return createArchiveErrorResponse(error, "아카이브 편집 정보를 불러오지 못했습니다.");
  }
}
