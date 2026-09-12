import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  getSupabaseAdminClient: vi.fn(),
  from: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdminClient: mocks.getSupabaseAdminClient,
}));

import {
  createUserSession,
  deleteUserSession,
  getCurrentUser,
  hashSessionToken,
  SESSION_COOKIE_NAME,
} from "./session";

describe("봉누록 user session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSupabaseAdminClient.mockReturnValue({ from: mocks.from });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("session cookie가 없으면 DB를 조회하지 않고 비로그인으로 처리함", async () => {
    mocks.cookies.mockResolvedValue({ get: vi.fn().mockReturnValue(undefined) });

    await expect(getCurrentUser()).resolves.toBeNull();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("위조된 session token은 비로그인으로 처리함", async () => {
    mockSessionCookie("forged-token");
    mockSessionLookup({ data: null, error: null });

    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it("만료된 session은 인증하지 않음", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-12T08:00:00.000Z"));
    mockSessionCookie("expired-token");
    mockSessionLookup({
      data: {
        expires_at: "2026-09-12T07:59:59.000Z",
        user: createDatabaseUser(),
      },
      error: null,
    });

    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it("유효한 session의 사용자와 기존 role/status를 반환함", async () => {
    mockSessionCookie("valid-token");
    mockSessionLookup({
      data: {
        expires_at: "2999-01-01T00:00:00.000Z",
        user: createDatabaseUser({ role: "admin", status: "suspended" }),
      },
      error: null,
    });

    await expect(getCurrentUser()).resolves.toEqual({
      id: "user-id",
      channelId: "channel-id",
      channelName: "채널 이름",
      role: "admin",
      status: "suspended",
    });
  });

  it("원본 session token 대신 SHA-256 hash만 저장함", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-12T08:00:00.000Z"));
    const insert = vi.fn().mockResolvedValue({ error: null });
    mocks.from.mockReturnValue({ insert });

    const session = await createUserSession("user-id");

    expect(session.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(insert).toHaveBeenCalledWith({
      user_id: "user-id",
      token_hash: hashSessionToken(session.token),
      expires_at: "2026-10-12T08:00:00.000Z",
    });
    expect(JSON.stringify(insert.mock.calls)).not.toContain(session.token);
  });

  it("logout 시 session token hash로 DB 행을 삭제함", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const deleteRows = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValue({ delete: deleteRows });

    await deleteUserSession("raw-token");

    expect(eq).toHaveBeenCalledWith(
      "token_hash",
      hashSessionToken("raw-token"),
    );
  });
});

function mockSessionCookie(token: string): void {
  mocks.cookies.mockResolvedValue({
    get: vi.fn((name: string) => (
      name === SESSION_COOKIE_NAME ? { value: token } : undefined
    )),
  });
}

function mockSessionLookup(result: {
  data: {
    expires_at: string;
    user: ReturnType<typeof createDatabaseUser>;
  } | null;
  error: null;
}): void {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  mocks.from.mockReturnValue({ select });
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
