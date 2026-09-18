import { NextResponse } from "next/server";

import { z } from "zod";

import { createArchiveErrorResponse } from "@/features/archives/archive-route";
import { ArchiveRequestError } from "@/features/archives/archive-error";
import { getArchivePersonDetail } from "@/features/archives/archive-service";

export async function GET(request: Request) {
  try {
    const result = z.object({ participant: z.uuid() }).safeParse({
      participant: new URL(request.url).searchParams.get("participant"),
    });

    if (!result.success) {
      throw new ArchiveRequestError("인물 정보가 올바르지 않습니다.", 400);
    }

    const detail = await getArchivePersonDetail(result.data.participant);

    if (!detail) {
      throw new ArchiveRequestError("인물 정보를 찾을 수 없습니다.", 404);
    }

    return NextResponse.json(detail, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return createArchiveErrorResponse(error, "인물 정보를 불러오지 못했습니다.");
  }
}
