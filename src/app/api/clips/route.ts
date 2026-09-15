import { NextResponse } from "next/server";

import { parseClipCursor } from "@/features/clips/clip-cursor";
import {
  getClipPage,
} from "@/features/clips/get-clips";
import { isClipSort, type ClipListFilters } from "@/features/clips/clip";
import { isKstDate } from "@/features/seasons/season-date";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_FILTER_VALUES = 20;

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const filters = parseFilters(searchParams);

  if (!filters) {
    return NextResponse.json(
      { message: "클립 필터가 올바르지 않음." },
      { status: 400 },
    );
  }

  const cursorValue = searchParams.get("cursor");
  const cursor = parseClipCursor(cursorValue);

  if (cursorValue && cursor === null) {
    return NextResponse.json(
      { message: "클립 페이지 정보가 올바르지 않음." },
      { status: 400 },
    );
  }

  try {
    const page = await getClipPage(filters, cursor);

    return NextResponse.json(page, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Failed to load clips", error);

    return NextResponse.json(
      { message: "클립을 불러오지 못함." },
      { status: 500 },
    );
  }
}

function parseFilters(searchParams: URLSearchParams): ClipListFilters | null {
  const query = searchParams.get("q")?.trim() ?? "";
  const groups = parseFilterValues(searchParams.get("groups"));
  const jobs = parseFilterValues(searchParams.get("jobs"));
  const participantId = searchParams.get("participant");
  const dayValue = searchParams.get("day");
  const date = searchParams.get("date");
  const sort = searchParams.get("sort") ?? "latest";

  if (
    query.length > 100 ||
    groups === null ||
    jobs === null ||
    (participantId !== null && !UUID_PATTERN.test(participantId)) ||
    (dayValue !== null &&
      (!/^\d+$/.test(dayValue) ||
        !Number.isSafeInteger(Number(dayValue)) ||
        Number(dayValue) < 1)) ||
    (date !== null && !isKstDate(date)) ||
    (dayValue !== null && date !== null) ||
    !isClipSort(sort)
  ) {
    return null;
  }

  return {
    date,
    day: dayValue === null ? null : Number(dayValue),
    groups,
    jobs,
    participantId,
    query,
    sort,
  };
}

function parseFilterValues(value: string | null): string[] | null {
  if (value === null || value === "") {
    return [];
  }

  const values = Array.from(
    new Set(value.split(",").map((item) => item.trim()).filter(Boolean)),
  );

  return values.length > MAX_FILTER_VALUES || values.some((item) => item.length > 80)
    ? null
    : values;
}
