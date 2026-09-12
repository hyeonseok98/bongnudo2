import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  deleteUserSession,
  SESSION_COOKIE_NAME,
} from "@/features/auth/session";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  try {
    if (token) {
      await deleteUserSession(token);
    }

    const response = NextResponse.json({ success: true });
    clearSessionCookie(response);

    return response;
  } catch (error) {
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
