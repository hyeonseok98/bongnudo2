import { Skeleton } from "@/components/ui/skeleton";

import { ArchiveHomeV2Skeleton } from "./_components/archive-home-v2";

export default function Loading() {
  return (
    <main className="space-y-8 py-5 sm:py-6 lg:py-8">
      <div
        aria-label="아카이브 홈을 불러오는 중입니다."
        className="overflow-hidden rounded-2xl border border-default bg-surface-raised px-5 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-12"
        role="status"
      >
        <Skeleton className="h-3 w-44" />
        <Skeleton className="mt-4 h-10 w-full max-w-xl" />
        <Skeleton className="mt-3 h-5 w-full max-w-2xl" />
        <Skeleton className="mt-6 h-10 w-full max-w-2xl" />
        <div className="mt-4 flex flex-wrap gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <ArchiveHomeV2Skeleton />
    </main>
  );
}
