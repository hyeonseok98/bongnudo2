import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createAuthRequestId } from "@/features/auth/auth-observability";
import {
  createOAuthState,
  getChzzkCallbackUrl,
  getLoginPageUrl,
  getSafeReturnTo,
  getSiteUrl,
  OAUTH_RETURN_TO_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
  OAUTH_STATE_MAX_AGE_SECONDS,
} from "@/features/auth/chzzk-oauth";
import {
  getUserBySessionToken,
  SESSION_COOKIE_NAME,
} from "@/features/auth/session";
import { createChzzkAuthorizationUrl } from "@/lib/chzzk";

const REQUIRED_CONSENTS = ["terms", "privacy", "age"] as const;

export function GET(request: NextRequest) {
  return NextResponse.redirect(
    getLoginPageUrl({
      returnTo: request.nextUrl.searchParams.get("returnTo"),
    }),
  );
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const returnTo = getSafeReturnTo(getFormValue(formData, "returnTo"));
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    const currentUser = await getUserBySessionToken(sessionToken, {
      requestId: createAuthRequestId(),
    });

    if (currentUser) {
      return NextResponse.redirect(new URL(returnTo, getSiteUrl()), 303);
    }
  }

  if (!REQUIRED_CONSENTS.every((name) => formData.get(name) === "true")) {
    return NextResponse.redirect(
      getLoginPageUrl({ error: "consent", returnTo }),
      303,
    );
  }

  try {
    const state = createOAuthState();
    const authorizationUrl = createChzzkAuthorizationUrl({
      redirectUri: getChzzkCallbackUrl(),
      state,
    });
    const response = NextResponse.redirect(authorizationUrl, 303);
    response.cookies.set(OAUTH_STATE_COOKIE_NAME, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
    });
    response.cookies.set(OAUTH_RETURN_TO_COOKIE_NAME, returnTo, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("Failed to start Chzzk OAuth", error);

    return NextResponse.redirect(
      getLoginPageUrl({ error: "failed", returnTo }),
      303,
    );
  }
}

function getFormValue(formData: FormData, name: string): string | null {
  const value = formData.get(name);

  return typeof value === "string" ? value : null;
}
