import { NextResponse } from "next/server";

import { getCurrentUser } from "@/features/auth/session";
import {
  createArchiveErrorResponse,
  parseArchiveId,
} from "@/features/archives/archive-route";
import { getArchiveDetail, saveArchive } from "@/features/archives/archive-service";
import { requireArchiveUser } from "@/features/archives/archive-user";

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ archiveId: string }> },
) {
  try {
    const { archiveId } = await params;
    const user = await requireArchiveUser();
    const archive = await saveArchive(user, parseArchiveId(archiveId), await request.json());

    return NextResponse.json(archive, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return createArchiveErrorResponse(error, "아카이브를 저장하지 못했습니다.");
  }
}
