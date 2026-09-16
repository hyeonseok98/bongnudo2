import { NextResponse } from "next/server";

import {
  createArchiveErrorResponse,
  parseArchiveId,
} from "@/features/archives/archive-route";
import { ArchiveRequestError } from "@/features/archives/archive-error";
import { restoreArchiveRevision } from "@/features/archives/archive-service";
import { requireArchiveUser } from "@/features/archives/archive-user";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ archiveId: string; revisionNumber: string }> },
) {
  try {
    const { archiveId, revisionNumber } = await params;
    const user = await requireArchiveUser();
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      throw new ArchiveRequestError("아카이브 요청이 올바르지 않습니다.");
    }

    const archive = await restoreArchiveRevision(user, parseArchiveId(archiveId), {
      ...body,
      revisionNumber: Number(revisionNumber),
    });

    return NextResponse.json(archive);
  } catch (error) {
    return createArchiveErrorResponse(error, "이전 revision을 복구하지 못했습니다.");
  }
}
