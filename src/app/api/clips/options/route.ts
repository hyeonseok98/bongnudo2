import { NextResponse } from "next/server";

import { getClipOptions } from "@/features/clips/get-clips";

export async function GET() {
  try {
    return NextResponse.json(await getClipOptions(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Failed to load clip options", error);

    return NextResponse.json(
      { message: "클립 필터 정보를 불러오지 못함." },
      { status: 500 },
    );
  }
}
