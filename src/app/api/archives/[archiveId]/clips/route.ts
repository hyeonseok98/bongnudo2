import { NextResponse } from "next/server";

import { parseClipCursor } from "@/features/clips/clip-cursor";
import {
  createArchiveErrorResponse,
  parseArchiveId,
} from "@/features/archives/archive-route";
import { getSystemArchiveClipPage } from "@/features/archives/archive-service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ archiveId: string }> },
) {
  const searchParams = new URL(request.url).searchParams;
  const cursorValue = searchParams.get("cursor");
  const cursor = parseClipCursor(cursorValue);
  const day = parseDay(searchParams.get("day"));

  if ((cursorValue !== null && cursor === null) || day === undefined) {
    return NextResponse.json(
      { error: "시스템 아카이브 클립 조회 정보가 올바르지 않습니다." },
      { status: 400 },
    );
  }

  try {
    const { archiveId } = await params;
    const page = await getSystemArchiveClipPage(parseArchiveId(archiveId), day, cursor);

    if (page === null) {
      return NextResponse.json({ error: "시스템 아카이브를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json(page, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return createArchiveErrorResponse(error, "시스템 아카이브 클립을 불러오지 못했습니다.");
  }
}

function parseDay(value: string | null): number | null | undefined {
  if (value === null) {
    return null;
  }

  if (!/^\d+$/.test(value)) {
    return undefined;
  }

  const day = Number(value);

  return Number.isSafeInteger(day) && day > 0 ? day : undefined;
}
