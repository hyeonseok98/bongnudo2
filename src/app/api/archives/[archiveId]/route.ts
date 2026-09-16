import { NextResponse } from "next/server";

import { getCurrentUser } from "@/features/auth/session";
import {
  createArchiveErrorResponse,
  parseArchiveId,
} from "@/features/archives/archive-route";
import { getArchiveDetail } from "@/features/archives/archive-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ archiveId: string }> },
) {
  try {
    const { archiveId } = await params;
    const viewer = await getCurrentUser();
    const archive = await getArchiveDetail(parseArchiveId(archiveId), viewer);

    if (!archive) {
      return NextResponse.json({ error: "아카이브를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ ...archive, isOwner: archive.isOwner && viewer !== null }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return createArchiveErrorResponse(error, "아카이브를 불러오지 못했습니다.");
  }
}
