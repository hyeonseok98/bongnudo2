import { Skeleton } from "@/components/ui/skeleton";

import { ArchiveDiscoveryHomeSkeleton } from "./_components/archive-discovery-home";

export default function Loading() {
  return (
    <main className="space-y-6 py-5 sm:py-6 lg:py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-title font-bold text-primary">아카이브</h1>
          <p className="mt-1 text-body text-secondary">봉누도2에서 만들어진 기록과 이야기를 찾아보세요.</p>
        </div>
        <div className="flex gap-2"><Skeleton className="h-10 w-28" /><Skeleton className="h-10 w-36" /></div>
      </header>
      <div aria-label="아카이브 탐색 탭을 불러오는 중입니다." className="flex gap-2" role="status">
        <Skeleton className="h-10 w-20" /><Skeleton className="h-10 w-20" /><Skeleton className="h-10 w-20" />
      </div>
      <div className="max-w-2xl"><Skeleton className="h-10 w-full" /></div>
      <ArchiveDiscoveryHomeSkeleton />
    </main>
  );
}
