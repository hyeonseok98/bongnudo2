import { NextResponse } from "next/server";

import {
  createArchiveErrorResponse,
  parseArchiveId,
} from "@/features/archives/archive-route";
import { getSystemArchiveClipSummary } from "@/features/archives/archive-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ archiveId: string }> },
) {
  try {
    const { archiveId } = await params;
    const summary = await getSystemArchiveClipSummary(parseArchiveId(archiveId));

    if (!summary) {
      return NextResponse.json(
        { error: "시스템 아카이브를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json(summary, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return createArchiveErrorResponse(
      error,
      "시스템 아카이브 정보를 불러오지 못했습니다.",
    );
  }
}
