import { afterEach, describe, expect, it, vi } from "vitest";

import { executeWithTransientSupabaseRetry } from "./supabase-retry";

describe("auth Supabase transient retry", () => {
  afterEach(() => vi.restoreAllMocks());

  it("504 응답을 한 번 재시도함", async () => {
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    const run = vi.fn()
      .mockResolvedValueOnce({
        error: { code: "PGRST003" },
        status: 504,
      })
      .mockResolvedValueOnce({ error: null, status: 200 });

    const result = await executeWithTransientSupabaseRetry({
      getRetryDelayMs: () => 0,
      operation: "auth.test",
      requestId: "request-id",
      run,
    });

    expect(result.error).toBeNull();
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("영구 오류는 재시도하지 않음", async () => {
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    const run = vi.fn().mockResolvedValue({
      error: { code: "42501" },
      status: 403,
    });

    const result = await executeWithTransientSupabaseRetry({
      getRetryDelayMs: () => 0,
      operation: "auth.test",
      requestId: "request-id",
      run,
    });

    expect(result.status).toBe(403);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("민감한 오류 message를 timing 로그에 포함하지 않음", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const run = vi.fn().mockResolvedValue({
      error: {
        code: "PGRST003",
        message: "secret-token-value",
      },
      status: 504,
    });

    await executeWithTransientSupabaseRetry({
      getRetryDelayMs: () => 0,
      maxAttempts: 1,
      operation: "auth.test",
      requestId: "request-id",
      run,
    });

    expect(JSON.stringify(info.mock.calls)).not.toContain("secret-token-value");
  });
});
