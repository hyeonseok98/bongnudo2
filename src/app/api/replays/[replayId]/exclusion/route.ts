import { NextResponse } from "next/server";

import {
  createCollectedMediaErrorResponse,
  parseExclusionRequest,
} from "@/features/collected-media/collected-media-route";
import { setCollectedMediaExclusion } from "@/features/collected-media/collected-media-exclusion";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ replayId: string }> },
) {
  try {
    const { replayId } = await params;
    const { excluded, mediaId } = await parseExclusionRequest(replayId, request);
    await setCollectedMediaExclusion("replay", mediaId, excluded);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return createCollectedMediaErrorResponse(error);
  }
}
