import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center py-12 text-center">
      <div className="max-w-xl space-y-6">
        <p className="text-hero font-bold tracking-tight text-brand-text">
          404
        </p>
        <div className="space-y-3">
          <h1 className="text-title font-bold text-primary">
            찾을 수 없는 페이지입니다.
          </h1>
          <p className="break-keep text-body text-secondary">
            요청하신 페이지가 존재하지 않거나 이동 또는 삭제되었을 수 있습니다.
          </p>
        </div>
        <div className="flex flex-col justify-center gap-2 sm:flex-row">
          <Link className={buttonVariants()} href="/">
            홈으로
          </Link>
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/characters"
          >
            인물 도감으로
          </Link>
        </div>
      </div>
    </main>
  );
}
