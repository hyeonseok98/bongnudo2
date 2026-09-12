import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ refreshLiveStreams: vi.fn() }));

vi.mock("@/features/live/refresh-live-streams", () => ({
  refreshLiveStreams: mocks.refreshLiveStreams,
}));

import { POST } from "./route";

describe("POST /api/internal/live-refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CRON_SECRET", "test-cron-secret");
    mocks.refreshLiveStreams.mockResolvedValue({
      currentStored: 1,
      refreshedAt: "2026-09-12T10:00:00.000Z",
      runId: "run-id",
      skippedDueToLock: false,
      snapshotSkipped: false,
      snapshotStoredCount: 1,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it.each([
    ["인증 헤더 없음", undefined],
    ["잘못된 secret", "Bearer wrong-secret"],
  ])("%s이면 401을 반환함", async (_label, authorization) => {
    const response = await POST(createRequest(authorization));

    expect(response.status).toBe(401);
    expect(mocks.refreshLiveStreams).not.toHaveBeenCalled();
  });

  it("인증된 요청은 통합 refresh 결과를 반환함", async () => {
    const response = await POST(createRequest("Bearer test-cron-secret"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      currentStored: 1,
      snapshotStoredCount: 1,
    });
  });

  it("refresh 실패를 500으로 반환함", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.refreshLiveStreams.mockRejectedValue(new Error("failed"));

    const response = await POST(createRequest("Bearer test-cron-secret"));

    expect(response.status).toBe(500);
  });
});

function createRequest(authorization?: string): Request {
  const headers = new Headers();

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  return new Request("http://localhost/api/internal/live-refresh", {
    method: "POST",
    headers,
  });
}
