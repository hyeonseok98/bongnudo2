import { NextResponse } from "next/server";

import { createArchiveErrorResponse } from "@/features/archives/archive-route";
import { createArchive } from "@/features/archives/archive-service";
import { requireArchiveUser } from "@/features/archives/archive-user";

export async function POST(request: Request) {
  try {
    const user = await requireArchiveUser();
    const archive = await createArchive(user, await request.json());

    return NextResponse.json(archive, { status: 201 });
  } catch (error) {
    return createArchiveErrorResponse(error, "아카이브를 생성하지 못했습니다.");
  }
}
