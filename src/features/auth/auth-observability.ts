import "server-only";

import { randomUUID } from "node:crypto";

export interface AuthTimingEvent {
  attempt?: number;
  durationMs: number;
  errorCode?: string;
  operation: string;
  outcome: "error" | "success";
  requestId: string;
  status?: number;
}

export function createAuthRequestId(): string {
  return randomUUID();
}

export function logAuthTiming(event: AuthTimingEvent): void {
  console.info("Auth timing", event);
}

export async function measureAuthOperation<T>({
  operation,
  requestId,
  run,
}: {
  operation: string;
  requestId: string;
  run: () => Promise<T>;
}): Promise<T> {
  const startedAt = performance.now();

  try {
    const result = await run();
    logAuthTiming({
      durationMs: getDurationMs(startedAt),
      operation,
      outcome: "success",
      requestId,
    });

    return result;
  } catch (error) {
    logAuthTiming({
      durationMs: getDurationMs(startedAt),
      errorCode: getSafeErrorCode(error),
      operation,
      outcome: "error",
      requestId,
    });
    throw error;
  }
}

export function getDurationMs(startedAt: number): number {
  return Math.round(performance.now() - startedAt);
}

export function getSafeErrorCode(error: unknown): string {
  if (error && typeof error === "object") {
    if ("code" in error && typeof error.code === "string") {
      return error.code;
    }

    if ("name" in error && typeof error.name === "string") {
      return error.name;
    }
  }

  return "UNKNOWN";
}
