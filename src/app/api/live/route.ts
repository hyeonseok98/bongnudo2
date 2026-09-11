import { NextResponse } from "next/server";

import { getCurrentLiveStreams } from "@/features/live/get-current-live-streams";

export async function GET() {
  try {
    const liveStreams = await getCurrentLiveStreams();
    const broadcasts = liveStreams.map(({ broadcast }) => broadcast);

    return NextResponse.json({ broadcasts });
  } catch (error) {
    console.error("Failed to load live broadcasts", error);

    return NextResponse.json(
      { message: "실시간 방송 정보를 불러오지 못함." },
      { status: 500 },
    );
  }
}
