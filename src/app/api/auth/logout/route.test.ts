import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ deleteUserSession: vi.fn() }));

vi.mock("@/features/auth/session", () => ({
  deleteUserSession: mocks.deleteUserSession,
  SESSION_COOKIE_NAME: "bongnurok_session",
}));

import { POST } from "./route";

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.deleteUserSession.mockResolvedValue(undefined);
  });

  it("현재 DB session을 삭제하고 cookie를 만료함", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/logout", {
      method: "POST",
      headers: { cookie: "bongnurok_session=raw-session-token" },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(mocks.deleteUserSession).toHaveBeenCalledWith("raw-session-token");
    expect(response.cookies.get("bongnurok_session")?.value).toBe("");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
