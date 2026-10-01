import { NextResponse } from "next/server";

import { getSurgingLiveBroadcasts } from "@/features/live/get-surging-live-broadcasts";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  try {
    const result = await getSurgingLiveBroadcasts();

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, max-age=20, s-maxage=20, stale-while-revalidate=10",
      },
    });
  } catch (error) {
    console.error("Failed to load surging LIVE broadcasts", error);

    return NextResponse.json(
      { message: "급상승 LIVE 정보를 불러오지 못함." },
      { status: 500 },
    );
  }
}
