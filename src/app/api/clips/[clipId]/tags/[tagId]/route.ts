import { NextResponse } from "next/server";

import { ClipTagRequestError, deleteClipTag } from "@/features/clips/clip-tag";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ clipId: string; tagId: string }> },
) {
  try {
    const { clipId, tagId } = await params;
    await deleteClipTag(clipId, tagId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof ClipTagRequestError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json({ message: "클립 태그를 삭제하지 못했습니다." }, { status: 500 });
  }
}
