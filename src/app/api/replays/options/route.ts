import { NextResponse } from "next/server";

import { getReplayOptions } from "@/features/replays/get-replays";

export async function GET() {
  try {
    return NextResponse.json(await getReplayOptions(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Failed to load replay options", error);

    return NextResponse.json(
      { message: "다시보기 필터 정보를 불러오지 못함." },
      { status: 500 },
    );
  }
}
