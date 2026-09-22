import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  cookieSet: vi.fn(),
  getCurrentUser: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: mocks.cookieGet,
    set: mocks.cookieSet,
  })),
}));

vi.mock("@/features/auth/session", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

import {
  ARCHIVE_ANONYMOUS_VOTER_COOKIE_NAME,
  getArchiveRecommendationViewer,
  prepareArchiveRecommendationViewer,
  setArchiveAnonymousVoterCookie,
} from "./archive-recommendation";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentUser.mockResolvedValue(null);
  mocks.cookieGet.mockReturnValue(undefined);
});

describe("Archive 익명 추천 identity", () => {
  it("첫 익명 추천에서 token을 만들고 HTTP-only cookie로 유지합니다", async () => {
    const prepared = await prepareArchiveRecommendationViewer();

    expect(prepared.anonymousTokenToSet).toEqual(expect.any(String));
    expect(prepared.viewer.userId).toBeNull();
    expect(prepared.viewer.anonymousVoterHash).toMatch(/^[0-9a-f]{64}$/);

    await setArchiveAnonymousVoterCookie(prepared.anonymousTokenToSet!);

    expect(mocks.cookieSet).toHaveBeenCalledWith(
      ARCHIVE_ANONYMOUS_VOTER_COOKIE_NAME,
      prepared.anonymousTokenToSet,
      expect.objectContaining({ httpOnly: true, sameSite: "lax" }),
    );

    mocks.cookieGet.mockReturnValue({ value: prepared.anonymousTokenToSet });
    const refreshedViewer = await getArchiveRecommendationViewer();

    expect(refreshedViewer.anonymousVoterHash).toBe(prepared.viewer.anonymousVoterHash);
  });

  it("로그인 후에도 기존 익명 hash를 함께 전달해 병합할 수 있게 합니다", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      channelId: "channel-id",
      channelName: "사용자",
      id: "7bd8025f-20ad-4f8e-a43e-f5afc801f88e",
      role: "user",
      status: "active",
    });
    mocks.cookieGet.mockReturnValue({ value: "existing-anonymous-token" });

    const prepared = await prepareArchiveRecommendationViewer();

    expect(prepared.anonymousTokenToSet).toBeNull();
    expect(prepared.viewer.userId).toBe("7bd8025f-20ad-4f8e-a43e-f5afc801f88e");
    expect(prepared.viewer.anonymousVoterHash).toMatch(/^[0-9a-f]{64}$/);
  });
});
