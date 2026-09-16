import { NextResponse } from "next/server";

import {
  createArchiveErrorResponse,
  parseArchiveId,
} from "@/features/archives/archive-route";
import { softDeleteArchive } from "@/features/archives/archive-service";
import { requireArchiveUser } from "@/features/archives/archive-user";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ archiveId: string }> },
) {
  try {
    const { archiveId } = await params;
    const user = await requireArchiveUser();
    await softDeleteArchive(user, parseArchiveId(archiveId));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return createArchiveErrorResponse(error, "아카이브를 삭제하지 못했습니다.");
  }
}
