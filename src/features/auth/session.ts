import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { cookies } from "next/headers";
import { cache } from "react";

import { getSupabaseAdminClient } from "@/lib/supabase/server";

import { createAuthRequestId } from "./auth-observability";
import { executeWithTransientSupabaseRetry } from "./supabase-retry";

export const SESSION_COOKIE_NAME = "bongnurok_session";
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export type UserRole = "user" | "admin";
export type UserStatus = "active" | "suspended";

export interface AuthenticatedUser {
  id: string;
  channelId: string;
  channelName: string;
  role: UserRole;
  status: UserStatus;
}

export interface CreatedUserSession {
  token: string;
  expiresAt: Date;
}

export async function createUserSession(
  userId: string,
  { requestId = createAuthRequestId() }: { requestId?: string } = {},
): Promise<CreatedUserSession> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  const sessionRow = {
    user_id: userId,
    token_hash: hashSessionToken(token),
    expires_at: expiresAt.toISOString(),
  };
  const supabase = getSupabaseAdminClient();
  const result = await executeWithTransientSupabaseRetry({
    operation: "auth.session.create",
    requestId,
    run: () => supabase
      .from("user_sessions")
      .upsert(sessionRow, {
        ignoreDuplicates: true,
        onConflict: "token_hash",
      }),
  });

  if (result.error) {
    throw new Error("로그인 세션을 생성하지 못함.", {
      cause: result.error,
    });
  }

  return { token, expiresAt };
}

export async function deleteUserSession(
  token: string,
  { requestId = createAuthRequestId() }: { requestId?: string } = {},
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const tokenHash = hashSessionToken(token);
  const result = await executeWithTransientSupabaseRetry({
    operation: "auth.session.delete",
    requestId,
    run: () => supabase
      .from("user_sessions")
      .delete()
      .eq("token_hash", tokenHash),
  });

  if (result.error) {
    throw new Error("로그아웃하지 못함.", { cause: result.error });
  }
}

export const getCurrentUser = cache(
  async (): Promise<AuthenticatedUser | null> => {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    return getUserBySessionToken(token);
  },
);

export async function getUserBySessionToken(
  token: string,
  { requestId = createAuthRequestId() }: { requestId?: string } = {},
): Promise<AuthenticatedUser | null> {
  const supabase = getSupabaseAdminClient();
  const result = await executeWithTransientSupabaseRetry({
    operation: "auth.session.validate",
    requestId,
    run: () => supabase
      .from("user_sessions")
      .select(`
        expires_at,
        user:users!user_sessions_user_id_fkey (
          id,
          chzzk_channel_id,
          chzzk_channel_name,
          role,
          status
        )
      `)
      .eq("token_hash", hashSessionToken(token))
      .maybeSingle(),
  });

  if (result.error) {
    console.error("Failed to validate user session", result.error);
    return null;
  }

  if (!result.data || new Date(result.data.expires_at).getTime() <= Date.now()) {
    return null;
  }

  return toAuthenticatedUser(result.data.user);
}

export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("로그인이 필요함.");
  }

  return user;
}

export async function requireActiveUser(): Promise<AuthenticatedUser> {
  const user = await requireUser();

  if (user.status !== "active") {
    throw new Error("사용이 제한된 계정임.");
  }

  return user;
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function toAuthenticatedUser(user: {
  id: string;
  chzzk_channel_id: string;
  chzzk_channel_name: string;
  role: string;
  status: string;
}): AuthenticatedUser {
  if (!isUserRole(user.role) || !isUserStatus(user.status)) {
    throw new Error("사용자 정보가 올바르지 않음.");
  }

  return {
    id: user.id,
    channelId: user.chzzk_channel_id,
    channelName: user.chzzk_channel_name,
    role: user.role,
    status: user.status,
  };
}

function isUserRole(role: string): role is UserRole {
  return role === "user" || role === "admin";
}

function isUserStatus(status: string): status is UserStatus {
  return status === "active" || status === "suspended";
}
