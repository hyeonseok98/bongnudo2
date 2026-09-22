import { NextResponse } from "next/server";

import { createArchiveErrorResponse } from "@/features/archives/archive-route";
import { getArchiveRecommendationViewer } from "@/features/archives/archive-recommendation";
import { getPublicArchivePage, createArchive } from "@/features/archives/archive-service";
import { requireArchiveUser } from "@/features/archives/archive-user";
import { parseArchiveListRequest } from "@/features/archives/archive-validation";

export async function GET(request: Request) {
  try {
    const { cursor, filters } = parseArchiveListRequest(new URL(request.url).searchParams);
    const recommendationViewer = await getArchiveRecommendationViewer();
    const page = await getPublicArchivePage(filters, cursor, recommendationViewer);

    return NextResponse.json(page, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return createArchiveErrorResponse(error, "공개 아카이브를 불러오지 못했습니다.");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireArchiveUser();
    const archive = await createArchive(user, await request.json());

    return NextResponse.json(archive, { status: 201 });
  } catch (error) {
    return createArchiveErrorResponse(error, "아카이브를 생성하지 못했습니다.");
  }
}
