import { NextResponse } from "next/server";
import { z } from "zod";

import { createArchiveErrorResponse } from "@/features/archives/archive-route";
import { ArchiveRequestError } from "@/features/archives/archive-error";
import { getArchiveRecommendationViewer } from "@/features/archives/archive-recommendation";
import { getArchivePeoplePage } from "@/features/archives/archive-service";

const requestSchema = z.object({
  affiliations: z.array(z.string().trim().min(1).max(100)).max(20),
  cursor: z.uuid().nullable(),
  jobs: z.array(z.string().trim().min(1).max(100)).max(20),
  participantId: z.uuid().nullable(),
  limit: z.coerce.number().int().min(1).max(12).default(12),
  query: z.string().trim().max(100),
});

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const result = requestSchema.safeParse({
      affiliations: searchParams.getAll("affiliation"),
      cursor: searchParams.get("cursor"),
      jobs: searchParams.getAll("job"),
      participantId: searchParams.get("participant"),
      limit: searchParams.get("limit") ?? undefined,
      query: searchParams.get("q") ?? "",
    });

    if (!result.success) {
      throw new ArchiveRequestError("인물 선택 정보가 올바르지 않습니다.", 400);
    }

    const recommendationViewer = await getArchiveRecommendationViewer();
    const page = await getArchivePeoplePage(
      result.data,
      result.data.cursor,
      recommendationViewer,
      result.data.limit,
    );

    return NextResponse.json(page, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return createArchiveErrorResponse(error, "인물별 아카이브를 불러오지 못했습니다.");
  }
}
