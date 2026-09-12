import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  exchangeChzzkAuthorizationCode: vi.fn(),
  getChzzkCurrentUser: vi.fn(),
  getSupabaseAdminClient: vi.fn(),
  from: vi.fn(),
  userUpsert: vi.fn(),
  userSelect: vi.fn(),
  userSingle: vi.fn(),
  sessionInsert: vi.fn(),
}));

vi.mock("@/lib/chzzk", () => ({
  exchangeChzzkAuthorizationCode: mocks.exchangeChzzkAuthorizationCode,
  getChzzkCurrentUser: mocks.getChzzkCurrentUser,
}));
vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdminClient: mocks.getSupabaseAdminClient,
}));

import {
  OAUTH_RETURN_TO_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
} from "@/features/auth/chzzk-oauth";
import {
  hashSessionToken,
  SESSION_COOKIE_NAME,
} from "@/features/auth/session";

import { GET } from "./route";

describe("GET /api/auth/chzzk/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("SITE_URL", "http://localhost:3000");
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.exchangeChzzkAuthorizationCode.mockResolvedValue("access-token");
    mocks.getChzzkCurrentUser.mockResolvedValue({
      channelId: "channel-id",
      channelName: "채널 이름",
    });
    mocks.userUpsert.mockReturnValue({ select: mocks.userSelect });
    mocks.userSelect.mockReturnValue({ single: mocks.userSingle });
    mocks.userSingle.mockResolvedValue({
      data: createDatabaseUser(),
      error: null,
    });
    mocks.sessionInsert.mockResolvedValue({ error: null });
    mocks.from.mockImplementation((table: string) => {
      if (table === "users") {
        return { upsert: mocks.userUpsert };
      }

      return { insert: mocks.sessionInsert };
    });
    mocks.getSupabaseAdminClient.mockReturnValue({ from: mocks.from });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("정상 callback에서 user를 upsert하고 자체 session cookie를 발급함", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = await GET(createCallbackRequest());
    const sessionCookie = response.cookies.get(SESSION_COOKIE_NAME);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/characters",
    );
    expect(mocks.exchangeChzzkAuthorizationCode).toHaveBeenCalledWith({
      code: "authorization-code",
      state: "oauth-state",
    });
    expect(mocks.userUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        chzzk_channel_id: "channel-id",
        chzzk_channel_name: "채널 이름",
        last_login_at: expect.any(String),
        updated_at: expect.any(String),
      }),
      {
        defaultToNull: false,
        onConflict: "chzzk_channel_id",
      },
    );
    expect(sessionCookie?.value).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(mocks.sessionInsert).toHaveBeenCalledWith({
      user_id: "user-id",
      token_hash: hashSessionToken(sessionCookie?.value ?? ""),
      expires_at: expect.any(String),
    });
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("SameSite=lax");
    expect(response.headers.get("set-cookie")).toContain("Secure");
    expect(response.headers.get("location")).not.toContain(
      sessionCookie?.value ?? "not-issued",
    );
    expect(JSON.stringify([
      mocks.userUpsert.mock.calls,
      mocks.sessionInsert.mock.calls,
    ])).not.toContain("access-token");
    expect(response.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value).toBe("");
    expect(response.cookies.get(OAUTH_RETURN_TO_COOKIE_NAME)?.value).toBe("");
  });

  it("재로그인 시 channelId로 갱신하되 admin/suspended를 덮어쓰지 않음", async () => {
    mocks.userSingle.mockResolvedValue({
      data: createDatabaseUser({ role: "admin", status: "suspended" }),
      error: null,
    });

    const response = await GET(createCallbackRequest());
    const upsertedUser = mocks.userUpsert.mock.calls[0][0];

    expect(response.status).toBe(307);
    expect(upsertedUser).not.toHaveProperty("role");
    expect(upsertedUser).not.toHaveProperty("status");
    expect(mocks.userUpsert.mock.calls[0][1]).toEqual({
      defaultToNull: false,
      onConflict: "chzzk_channel_id",
    });
  });

  it("OAuth state가 다르면 인증과 session 생성을 중단함", async () => {
    const response = await GET(createCallbackRequest({ cookieState: "wrong-state" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "인증 요청이 올바르지 않음.",
    });
    expect(mocks.exchangeChzzkAuthorizationCode).not.toHaveBeenCalled();
    expect(mocks.sessionInsert).not.toHaveBeenCalled();
    expect(response.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value).toBe("");
  });

  it("state가 없으면 로그인하지 않음", async () => {
    const response = await GET(createCallbackRequest({ queryState: null }));

    expect(response.status).toBe(400);
    expect(mocks.exchangeChzzkAuthorizationCode).not.toHaveBeenCalled();
    expect(mocks.sessionInsert).not.toHaveBeenCalled();
  });

  it("code가 없는 취소 callback은 로그인 이전 페이지로 복귀함", async () => {
    const response = await GET(createCallbackRequest({ code: null }));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/characters",
    );
    expect(mocks.exchangeChzzkAuthorizationCode).not.toHaveBeenCalled();
    expect(mocks.sessionInsert).not.toHaveBeenCalled();
    expect(response.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value).toBe("");
    expect(response.cookies.get(OAUTH_RETURN_TO_COOKIE_NAME)?.value).toBe("");
  });

  it("users/me 정보가 올바르지 않으면 session을 만들지 않음", async () => {
    mocks.getChzzkCurrentUser.mockRejectedValue(
      new Error("치지직 사용자 정보를 불러오지 못함."),
    );

    const response = await GET(createCallbackRequest());

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?returnTo=%2Fcharacters&error=failed",
    );
    expect(mocks.userUpsert).not.toHaveBeenCalled();
    expect(mocks.sessionInsert).not.toHaveBeenCalled();
  });
});

function createCallbackRequest({
  code = "authorization-code",
  queryState = "oauth-state",
  cookieState = "oauth-state",
}: {
  code?: string | null;
  queryState?: string | null;
  cookieState?: string;
} = {}): NextRequest {
  const url = new URL("http://localhost:3000/api/auth/chzzk/callback");

  if (code) {
    url.searchParams.set("code", code);
  }

  if (queryState) {
    url.searchParams.set("state", queryState);
  }

  return new NextRequest(url, {
    headers: {
      cookie: `${OAUTH_STATE_COOKIE_NAME}=${cookieState}; ${OAUTH_RETURN_TO_COOKIE_NAME}=%2Fcharacters`,
    },
  });
}

function createDatabaseUser({
  role = "user",
  status = "active",
}: {
  role?: string;
  status?: string;
} = {}) {
  return {
    id: "user-id",
    chzzk_channel_id: "channel-id",
    chzzk_channel_name: "채널 이름",
    role,
    status,
  };
}
