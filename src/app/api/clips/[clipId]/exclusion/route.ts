import { NextResponse } from "next/server";

import {
  createCollectedMediaErrorResponse,
  parseExclusionRequest,
} from "@/features/collected-media/collected-media-route";
import { setCollectedMediaExclusion } from "@/features/collected-media/collected-media-exclusion";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clipId: string }> },
) {
  try {
    const { clipId } = await params;
    const { excluded, mediaId } = await parseExclusionRequest(clipId, request);
    await setCollectedMediaExclusion("clip", mediaId, excluded);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return createCollectedMediaErrorResponse(error);
  }
}
