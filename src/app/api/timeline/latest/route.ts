import { NextResponse } from "next/server";

import { getLatestTimelineEvents } from "@/features/timeline/get-latest-timeline-events";

export async function GET() {
  try {
    const events = await getLatestTimelineEvents();

    return NextResponse.json(
      { events },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Failed to load latest timeline", error);

    return NextResponse.json(
      { message: "타임라인을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
