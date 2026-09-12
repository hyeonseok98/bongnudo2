import "server-only";

import {
  getDurationMs,
  getSafeErrorCode,
  logAuthTiming,
} from "./auth-observability";

const RETRYABLE_HTTP_STATUSES = new Set([503, 504, 520]);
const RETRYABLE_POSTGREST_CODES = new Set([
  "PGRST000",
  "PGRST001",
  "PGRST002",
  "PGRST003",
]);
const DEFAULT_MAX_ATTEMPTS = 2;

interface SupabaseOperationResult {
  error: { code?: string } | null;
  status?: number;
}

export async function executeWithTransientSupabaseRetry<
  TResult extends SupabaseOperationResult,
>({
  getRetryDelayMs = getDefaultRetryDelayMs,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  operation,
  requestId,
  run,
}: {
  getRetryDelayMs?: (attempt: number) => number;
  maxAttempts?: number;
  operation: string;
  requestId: string;
  run: () => PromiseLike<TResult>;
}): Promise<TResult> {
  let attempt = 1;

  while (true) {
    const startedAt = performance.now();

    try {
      const result = await run();
      const shouldRetry = result.error !== null
        && isTransientSupabaseError(result);

      logAuthTiming({
        attempt,
        durationMs: getDurationMs(startedAt),
        errorCode: result.error?.code ?? getHttpErrorCode(result.status),
        operation,
        outcome: result.error ? "error" : "success",
        requestId,
        status: result.status,
      });

      if (!shouldRetry || attempt >= maxAttempts) {
        return result;
      }
    } catch (error) {
      logAuthTiming({
        attempt,
        durationMs: getDurationMs(startedAt),
        errorCode: getSafeErrorCode(error),
        operation,
        outcome: "error",
        requestId,
      });

      if (!isTransientNetworkError(error) || attempt >= maxAttempts) {
        throw error;
      }
    }

    await wait(getRetryDelayMs(attempt));
    attempt += 1;
  }
}

function isTransientSupabaseError(result: SupabaseOperationResult): boolean {
  return result.status === 0
    || (result.status !== undefined
      && RETRYABLE_HTTP_STATUSES.has(result.status))
    || (result.error?.code !== undefined
      && RETRYABLE_POSTGREST_CODES.has(result.error.code));
}

function isTransientNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true;
  }

  if (!error || typeof error !== "object" || !("code" in error)) {
    return false;
  }

  return typeof error.code === "string"
    && /^(ECONN|ENET|ETIMEDOUT|UND_)/.test(error.code);
}

function getDefaultRetryDelayMs(): number {
  return 300 + Math.floor(Math.random() * 401);
}

function getHttpErrorCode(status: number | undefined): string | undefined {
  return status && status >= 400 ? `HTTP_${status}` : undefined;
}

function wait(durationMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}
