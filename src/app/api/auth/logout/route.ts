import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  createAuthRequestId,
  getDurationMs,
  getSafeErrorCode,
  logAuthTiming,
} from "@/features/auth/auth-observability";
import {
  deleteUserSession,
  SESSION_COOKIE_NAME,
} from "@/features/auth/session";

export async function POST(request: NextRequest) {
  const requestId = createAuthRequestId();
  const startedAt = performance.now();
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  try {
    if (token) {
      await deleteUserSession(token, { requestId });
    }

    const response = NextResponse.json({ success: true });
    clearSessionCookie(response);
    logAuthTiming({
      durationMs: getDurationMs(startedAt),
      operation: "auth.logout.total",
      outcome: "success",
      requestId,
    });

    return response;
  } catch (error) {
    logAuthTiming({
      durationMs: getDurationMs(startedAt),
      errorCode: getSafeErrorCode(error),
      operation: "auth.logout.total",
      outcome: "error",
      requestId,
    });
    console.error("Failed to log out", error);
    const response = NextResponse.json(
      { message: "로그아웃하지 못함." },
      { status: 500 },
    );
    clearSessionCookie(response);

    return response;
  }
}

function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
