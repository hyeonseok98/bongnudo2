import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  getLoginPageUrl,
  getSafeCookieReturnTo,
  getSiteUrl,
  hasValidOAuthState,
  OAUTH_RETURN_TO_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
} from "@/features/auth/chzzk-oauth";
import {
  createUserSession,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  toAuthenticatedUser,
} from "@/features/auth/session";
import {
  exchangeChzzkAuthorizationCode,
  getChzzkCurrentUser,
} from "@/lib/chzzk";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value;
  const returnTo = getSafeCookieReturnTo(
    request.cookies.get(OAUTH_RETURN_TO_COOKIE_NAME)?.value,
  );

  if (!code) {
    return createOAuthCancelResponse(returnTo);
  }

  if (!state || !storedState) {
    return createOAuthErrorResponse("인증 정보가 올바르지 않음.", 400);
  }

  if (!hasValidOAuthState(state, storedState)) {
    return createOAuthErrorResponse("인증 요청이 올바르지 않음.", 400);
  }

  try {
    const accessToken = await exchangeChzzkAuthorizationCode({ code, state });
    const chzzkUser = await getChzzkCurrentUser(accessToken);
    const loggedInAt = new Date().toISOString();
    const userResult = await getSupabaseAdminClient()
      .from("users")
      .upsert(
        {
          chzzk_channel_id: chzzkUser.channelId,
          chzzk_channel_name: chzzkUser.channelName,
          last_login_at: loggedInAt,
          updated_at: loggedInAt,
        },
        {
          defaultToNull: false,
          onConflict: "chzzk_channel_id",
        },
      )
      .select("id, chzzk_channel_id, chzzk_channel_name, role, status")
      .single();

    if (userResult.error) {
      throw new Error("사용자 정보를 저장하지 못함.", {
        cause: userResult.error,
      });
    }

    const user = toAuthenticatedUser(userResult.data);
    const session = await createUserSession(user.id);
    const response = NextResponse.redirect(new URL(returnTo, getSiteUrl()));
    response.cookies.set(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
      expires: session.expiresAt,
    });
    clearOAuthCookies(response);

    return response;
  } catch (error) {
    console.error("Failed to complete Chzzk OAuth", error);
    return createOAuthRedirectResponse({ error: "failed", returnTo });
  }
}

function createOAuthRedirectResponse({
  error,
  returnTo,
}: {
  error: "failed";
  returnTo: string;
}) {
  const response = NextResponse.redirect(getLoginPageUrl({ error, returnTo }));
  clearOAuthCookies(response);

  return response;
}

function createOAuthCancelResponse(returnTo: string) {
  const response = NextResponse.redirect(new URL(returnTo, getSiteUrl()));
  clearOAuthCookies(response);

  return response;
}

function createOAuthErrorResponse(message: string, status: number) {
  const response = NextResponse.json({ message }, { status });
  clearOAuthCookies(response);

  return response;
}

function clearOAuthCookies(response: NextResponse): void {
  for (const cookieName of [
    OAUTH_STATE_COOKIE_NAME,
    OAUTH_RETURN_TO_COOKIE_NAME,
  ]) {
    response.cookies.set(cookieName, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
}
