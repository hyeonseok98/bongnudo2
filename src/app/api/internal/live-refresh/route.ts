import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { refreshLiveStreams } from "@/features/live/refresh-live-streams";

export const maxDuration = 120;

export async function POST(request: Request) {
  if (!hasValidCronAuthorization(request)) {
    return NextResponse.json(
      { message: "인증되지 않은 요청임." },
      { status: 401 },
    );
  }

  try {
    const result = await refreshLiveStreams();

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to refresh LIVE streams", error);

    return NextResponse.json(
      { message: "LIVE 정보를 갱신하지 못함." },
      { status: 500 },
    );
  }
}

function hasValidCronAuthorization(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || !authorization?.startsWith("Bearer ")) {
    return false;
  }

  const receivedSecret = authorization.slice("Bearer ".length);
  const expectedBuffer = Buffer.from(cronSecret);
  const receivedBuffer = Buffer.from(receivedSecret);

  return expectedBuffer.length === receivedBuffer.length
    && timingSafeEqual(expectedBuffer, receivedBuffer);
}
