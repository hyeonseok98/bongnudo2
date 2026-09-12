import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getCurrentUser: vi.fn() }));

vi.mock("@/features/auth/session", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

import { GET } from "./route";

describe("GET /api/auth/me", () => {
  beforeEach(() => vi.clearAllMocks());

  it("비로그인 상태에서는 user null을 반환함", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ user: null });
  });

  it("로그인 상태에서는 검증된 사용자를 반환함", async () => {
    const user = {
      id: "user-id",
      channelId: "channel-id",
      channelName: "채널 이름",
      role: "user",
      status: "active",
    };
    mocks.getCurrentUser.mockResolvedValue(user);

    const response = await GET();

    await expect(response.json()).resolves.toEqual({ user });
  });
});
