"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button, buttonVariants } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error", error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center py-12 text-center">
      <div className="max-w-xl space-y-6">
        <p className="text-heading-sm font-semibold tracking-wide text-brand-text">
          ERROR
        </p>
        <div className="space-y-3">
          <h1 className="text-title font-bold text-primary">
            페이지를 불러오지 못했습니다.
          </h1>
          <p className="text-body text-secondary">
            일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.
          </p>
        </div>
        <div className="flex flex-col justify-center gap-2 sm:flex-row">
          <Button onClick={reset}>다시 시도</Button>
          <Link className={buttonVariants({ variant: "outline" })} href="/">
            홈으로
          </Link>
        </div>
      </div>
    </main>
  );
}
