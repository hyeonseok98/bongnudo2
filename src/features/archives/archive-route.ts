import { NextResponse } from "next/server";
import { z } from "zod";

import { ArchiveRequestError } from "./archive-error";

const archiveIdSchema = z.uuid("아카이브 정보가 올바르지 않습니다.");

export function parseArchiveId(value: string): string {
  const result = archiveIdSchema.safeParse(value);

  if (!result.success) {
    throw new ArchiveRequestError(result.error.issues[0]?.message ?? "아카이브 정보가 올바르지 않습니다.");
  }

  return result.data;
}

export function createArchiveErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof ArchiveRequestError) {
    if (error.status >= 500) {
      console.error("Archive request failed", error);
    }

    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error("Archive request failed", error);
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
