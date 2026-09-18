import { NextResponse } from "next/server";

import { z } from "zod";

import { createArchiveErrorResponse } from "@/features/archives/archive-route";
import { ArchiveRequestError } from "@/features/archives/archive-error";
import { getPublicUserArchivesForSeasonDay } from "@/features/archives/archive-service";

export async function GET(request: Request) {
  try {
    const result = z.object({ seasonDay: z.uuid() }).safeParse({
      seasonDay: new URL(request.url).searchParams.get("seasonDay"),
    });

    if (!result.success) {
      throw new ArchiveRequestError("봉누도 일차 정보가 올바르지 않습니다.", 400);
    }

    const archives = await getPublicUserArchivesForSeasonDay(result.data.seasonDay);

    return NextResponse.json(archives, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return createArchiveErrorResponse(error, "관련 아카이브를 불러오지 못했습니다.");
  }
}
