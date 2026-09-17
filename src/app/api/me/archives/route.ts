import { NextResponse } from "next/server";

import { getCurrentUser } from "@/features/auth/session";
import { createArchiveErrorResponse } from "@/features/archives/archive-route";
import { getMyArchivePage } from "@/features/archives/archive-service";
import { parseMyArchiveListRequest } from "@/features/archives/archive-validation";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { cursor, tab } = parseMyArchiveListRequest(new URL(request.url).searchParams);
    const page = await getMyArchivePage(user, tab, cursor);

    return NextResponse.json(page, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return createArchiveErrorResponse(error, "내 아카이브를 불러오지 못했습니다.");
  }
}
