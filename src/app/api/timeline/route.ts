import { NextResponse } from "next/server";

import { getTimelinePage } from "@/features/timeline/get-timeline-page";
import { parseTimelineSearchParams } from "@/features/timeline/timeline-params";

export async function GET(request: Request) {
  try {
    const filters = parseTimelineSearchParams(
      new URL(request.url).searchParams,
    );
    const timeline = await getTimelinePage(filters);

    return NextResponse.json(timeline, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Failed to load timeline", error);

    return NextResponse.json(
      { message: "타임라인을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
