import { NextResponse } from "next/server";

import { resolveChzzkClipThumbnail } from "@/features/timeline/chzzk-clip-thumbnail";

const CACHE_CONTROL =
  "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800";

export async function GET(request: Request) {
  const clipUrl = new URL(request.url).searchParams.get("clipUrl")?.trim();

  if (!clipUrl) {
    return NextResponse.json(
      { message: "클립 주소가 필요합니다." },
      { status: 400 },
    );
  }

  const thumbnailUrl = await resolveChzzkClipThumbnail(clipUrl);

  return NextResponse.json(
    { thumbnailUrl },
    { headers: { "Cache-Control": CACHE_CONTROL } },
  );
}
