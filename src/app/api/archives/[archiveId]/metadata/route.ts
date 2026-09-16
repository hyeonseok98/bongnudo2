import { NextResponse } from "next/server";

import {
  createArchiveErrorResponse,
  parseArchiveId,
} from "@/features/archives/archive-route";
import { updateArchiveMetadata } from "@/features/archives/archive-service";
import { requireArchiveUser } from "@/features/archives/archive-user";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ archiveId: string }> },
) {
  try {
    const { archiveId } = await params;
    const user = await requireArchiveUser();
    const archive = await updateArchiveMetadata(user, parseArchiveId(archiveId), await request.json());

    return NextResponse.json(archive);
  } catch (error) {
    return createArchiveErrorResponse(error, "아카이브 정보를 저장하지 못했습니다.");
  }
}
