import { NextResponse } from "next/server";

import {
  ClipTagRequestError,
  searchClipTags,
} from "@/features/clips/clip-tag";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const query = searchParams.get("query")?.trim() ?? "";
    const ids = parseTagIds(searchParams.get("ids"));

    if (query.length > 20 || ids === null) {
      return NextResponse.json({ message: "태그 검색 정보가 올바르지 않습니다." }, { status: 400 });
    }

    return NextResponse.json({ tags: await searchClipTags(query, ids) });
  } catch (error) {
    return createClipTagErrorResponse(error);
  }
}

function parseTagIds(value: string | null): string[] | null {
  if (!value) {
    return [];
  }

  const ids = Array.from(new Set(value.split(",").map((item) => item.trim()).filter(Boolean)));

  return ids.length <= 20 && ids.every((id) => UUID_PATTERN.test(id)) ? ids : null;
}

function createClipTagErrorResponse(error: unknown) {
  if (error instanceof ClipTagRequestError) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  return NextResponse.json({ message: "태그를 검색하지 못했습니다." }, { status: 500 });
}
