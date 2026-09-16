import "server-only";

import type { AuthenticatedUser } from "@/features/auth/session";
import { getCurrentUser } from "@/features/auth/session";

import { ArchiveRequestError } from "./archive-error";

export async function requireArchiveUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new ArchiveRequestError("로그인이 필요합니다.", 401);
  }

  if (user.status !== "active") {
    throw new ArchiveRequestError("아카이브 편집이 제한된 계정입니다.", 403);
  }

  return user;
}
