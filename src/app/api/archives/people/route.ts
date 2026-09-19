import { NextResponse } from "next/server";

import { createArchiveErrorResponse } from "@/features/archives/archive-route";
import { getArchivePeopleSections } from "@/features/archives/archive-service";

export async function GET() {
  try {
    const sections = await getArchivePeopleSections();

    return NextResponse.json(sections, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return createArchiveErrorResponse(error, "인물별 아카이브를 불러오지 못했습니다.");
  }
}
