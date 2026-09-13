"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error", error);
  }, [error]);

  return (
    <html lang="ko">
      <body
        className="min-h-dvh bg-background text-primary"
        style={{ fontFamily: "system-ui, sans-serif" }}
      >
        <main className="flex min-h-dvh items-center justify-center px-4 py-12 text-center">
          <div className="max-w-xl space-y-6">
            <div className="space-y-3">
              <h1 className="text-title font-bold text-primary">
                서비스를 불러오지 못했습니다.
              </h1>
              <p className="text-body text-secondary">
                일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.
              </p>
            </div>
            <button
              className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg border border-brand bg-brand px-4 text-body-sm font-medium text-brand-foreground transition-[background-color,border-color,color,opacity] duration-default hover:opacity-90 focus-visible:border-focus-ring"
              onClick={reset}
              type="button"
            >
              다시 시도
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
