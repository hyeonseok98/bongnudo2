import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getUserBySessionToken: vi.fn() }));

vi.mock("@/features/auth/session", () => ({
  getUserBySessionToken: mocks.getUserBySessionToken,
  SESSION_COOKIE_NAME: "bongnurok_session",
}));

import {
  OAUTH_RETURN_TO_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
} from "@/features/auth/chzzk-oauth";

import { GET, POST } from "./route";

describe("/api/auth/chzzk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CHZZK_CLIENT_ID", "client-id");
    vi.stubEnv("CHZZK_CLIENT_SECRET", "client-secret");
    vi.stubEnv("SITE_URL", "http://localhost:3000");
    mocks.getUserBySessionToken.mockResolvedValue(null);
  });

  afterEach(() => vi.unstubAllEnvs());

  it("GET 요청은 동의 화면으로 이동함", () => {
    const response = GET(
      new NextRequest("http://localhost:3000/api/auth/chzzk?returnTo=/live"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?returnTo=%2Flive",
    );
  });

  it("필수 동의를 제출하면 state와 복귀 경로를 저장하고 공식 로그인 화면으로 이동함", async () => {
    const response = await POST(createStartRequest());
    const location = new URL(response.headers.get("location") ?? "");
    const stateCookie = response.cookies.get(OAUTH_STATE_COOKIE_NAME);

    expect(response.status).toBe(303);
    expect(location.origin + location.pathname).toBe(
      "https://chzzk.naver.com/account-interlock",
    );
    expect(location.searchParams.get("redirectUri")).toBe(
      "http://localhost:3000/api/auth/chzzk/callback",
    );
    expect(location.searchParams.get("state")).toBe(stateCookie?.value);
    expect(response.cookies.get(OAUTH_RETURN_TO_COOKIE_NAME)?.value).toBe(
      "/characters?view=grid",
    );
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("SameSite=lax");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=600");
  });

  it("필수 동의가 빠지면 OAuth를 시작하지 않음", async () => {
    const response = await POST(createStartRequest({ privacy: false }));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?returnTo=%2Fcharacters%3Fview%3Dgrid&error=consent",
    );
    expect(response.cookies.get(OAUTH_STATE_COOKIE_NAME)).toBeUndefined();
  });

  it("유효한 session이 있으면 OAuth를 다시 시작하지 않음", async () => {
    mocks.getUserBySessionToken.mockResolvedValue({
      id: "user-id",
      channelId: "channel-id",
      channelName: "채널 이름",
      role: "user",
      status: "active",
    });
    const response = await POST(createStartRequest({ session: true }));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/characters?view=grid",
    );
    expect(response.cookies.get(OAUTH_STATE_COOKIE_NAME)).toBeUndefined();
  });
});

function createStartRequest({
  terms = true,
  privacy = true,
  age = true,
  session = false,
}: {
  terms?: boolean;
  privacy?: boolean;
  age?: boolean;
  session?: boolean;
} = {}): NextRequest {
  const formData = new FormData();
  formData.set("returnTo", "/characters?view=grid");

  if (terms) {
    formData.set("terms", "true");
  }

  if (privacy) {
    formData.set("privacy", "true");
  }

  if (age) {
    formData.set("age", "true");
  }

  return new NextRequest("http://localhost:3000/api/auth/chzzk", {
    body: formData,
    headers: session
      ? { cookie: "bongnurok_session=valid-session-token" }
      : undefined,
    method: "POST",
  });
}
