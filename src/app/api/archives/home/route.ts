import { NextResponse } from "next/server";

import { getArchiveRecommendationViewer } from "@/features/archives/archive-recommendation";
import { createArchiveErrorResponse } from "@/features/archives/archive-route";
import { getArchiveDiscoveryHome } from "@/features/archives/archive-service";

export async function GET() {
  try {
    const viewer = await getArchiveRecommendationViewer();
    return NextResponse.json(await getArchiveDiscoveryHome(viewer), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return createArchiveErrorResponse(error, "아카이브 탐색 정보를 불러오지 못함.");
  }
}
