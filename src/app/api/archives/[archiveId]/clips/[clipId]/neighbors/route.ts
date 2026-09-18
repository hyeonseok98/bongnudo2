import { NextResponse } from "next/server";

import { isClipSort } from "@/features/clips/clip";
import {
  createArchiveErrorResponse,
  parseArchiveId,
} from "@/features/archives/archive-route";
import { getSystemArchiveClipNeighbors } from "@/features/archives/archive-service";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ archiveId: string; clipId: string }> },
) {
  const searchParams = new URL(request.url).searchParams;
  const day = parseDay(searchParams.get("day"));
  const sort = searchParams.get("sort") ?? "oldest";

  if (day === undefined || !isClipSort(sort)) {
    return NextResponse.json({ error: "주변 클립 조회 정보가 올바르지 않습니다." }, { status: 400 });
  }

  try {
    const { archiveId, clipId } = await params;

    if (!UUID_PATTERN.test(clipId)) {
      return NextResponse.json({ error: "클립 정보가 올바르지 않습니다." }, { status: 400 });
    }

    const items = await getSystemArchiveClipNeighbors(
      parseArchiveId(archiveId),
      clipId,
      day,
      sort,
    );

    if (items === null) {
      return NextResponse.json({ error: "시스템 아카이브를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return createArchiveErrorResponse(error, "주변 클립을 불러오지 못했습니다.");
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
