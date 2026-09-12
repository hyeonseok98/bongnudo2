import { NextResponse } from "next/server";

import { getCachedLiveBroadcasts } from "@/features/live/live-current";

export async function GET() {
  try {
    const liveBroadcasts = await getCachedLiveBroadcasts();

    return NextResponse.json(liveBroadcasts, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Failed to load live broadcasts", error);

    return NextResponse.json(
      { message: "실시간 방송 정보를 불러오지 못함." },
      { status: 500 },
    );
  }
}
