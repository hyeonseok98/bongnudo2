import { NextResponse } from "next/server";
import { z } from "zod";

import { createArchiveErrorResponse } from "@/features/archives/archive-route";
import { ArchiveRequestError } from "@/features/archives/archive-error";
import { getArchivePeopleSections } from "@/features/archives/archive-service";

const participantIdsSchema = z.array(z.uuid()).min(1).max(24);

export async function GET(request: Request) {
  try {
    const result = participantIdsSchema.safeParse(
      new URL(request.url).searchParams.getAll("participant"),
    );

    if (!result.success) {
      throw new ArchiveRequestError("인물 선택 정보가 올바르지 않습니다.", 400);
    }

    const sections = await getArchivePeopleSections(result.data);

    return NextResponse.json(sections, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return createArchiveErrorResponse(error, "인물별 아카이브를 불러오지 못했습니다.");
  }
}
