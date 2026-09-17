import { NextResponse } from "next/server";
import { z } from "zod";

import { CollectedMediaRequestError } from "./collected-media-exclusion";

const mediaIdSchema = z.uuid("영상 정보가 올바르지 않습니다.");
const exclusionRequestSchema = z.object({
  excluded: z.boolean(),
});

export async function parseExclusionRequest(
  mediaId: string,
  request: Request,
): Promise<{ excluded: boolean; mediaId: string }> {
  const parsedMediaId = mediaIdSchema.safeParse(mediaId);

  if (!parsedMediaId.success) {
    throw new CollectedMediaRequestError(
      parsedMediaId.error.issues[0]?.message ?? "영상 정보가 올바르지 않습니다.",
      400,
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new CollectedMediaRequestError("요청 내용이 올바르지 않습니다.", 400);
  }

  const parsedBody = exclusionRequestSchema.safeParse(body);

  if (!parsedBody.success) {
    throw new CollectedMediaRequestError("요청 내용이 올바르지 않습니다.", 400);
  }

  return { excluded: parsedBody.data.excluded, mediaId: parsedMediaId.data };
}

export function createCollectedMediaErrorResponse(error: unknown) {
  if (error instanceof CollectedMediaRequestError) {
    if (error.status >= 500) {
      console.error("Collected media request failed", error);
    }

    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  console.error("Collected media request failed", error);
  return NextResponse.json({ message: "영상을 제외하지 못했습니다." }, { status: 500 });
}
