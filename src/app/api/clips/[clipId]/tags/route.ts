import { NextResponse } from "next/server";

import {
  addClipTag,
  ClipTagRequestError,
  getClipTags,
} from "@/features/clips/clip-tag";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clipId: string }> },
) {
  try {
    const { clipId } = await params;

    return NextResponse.json({ tags: await getClipTags(clipId) });
  } catch (error) {
    return createClipTagErrorResponse(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ clipId: string }> },
) {
  try {
    const { clipId } = await params;
    const body = await request.json();
    const name = getTagName(body);

    return NextResponse.json({ tags: await addClipTag(clipId, name) }, { status: 201 });
  } catch (error) {
    return createClipTagErrorResponse(error);
  }
}

function getTagName(value: unknown): string {
  if (typeof value !== "object" || value === null) {
    throw new ClipTagRequestError("태그 정보가 올바르지 않습니다.", 400);
  }

  const name = Reflect.get(value, "name");

  if (typeof name !== "string") {
    throw new ClipTagRequestError("태그 정보가 올바르지 않습니다.", 400);
  }

  return name;
}

function createClipTagErrorResponse(error: unknown) {
  if (error instanceof ClipTagRequestError) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  return NextResponse.json({ message: "클립 태그를 처리하지 못했습니다." }, { status: 500 });
}
