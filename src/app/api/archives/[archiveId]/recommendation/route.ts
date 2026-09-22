import { NextResponse } from "next/server";

import { createArchiveErrorResponse, parseArchiveId } from "@/features/archives/archive-route";
import {
  prepareArchiveRecommendationViewer,
  setArchiveAnonymousVoterCookie,
  toggleArchiveRecommendation,
} from "@/features/archives/archive-recommendation";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ archiveId: string }> },
) {
  try {
    const { archiveId } = await params;
    const preparedViewer = await prepareArchiveRecommendationViewer();
    const result = await toggleArchiveRecommendation(
      parseArchiveId(archiveId),
      preparedViewer.viewer,
    );

    if (preparedViewer.anonymousTokenToSet) {
      await setArchiveAnonymousVoterCookie(preparedViewer.anonymousTokenToSet);
    }

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return createArchiveErrorResponse(error, "추천 처리에 실패했습니다.");
  }
}
