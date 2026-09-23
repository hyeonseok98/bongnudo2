import { Skeleton } from "@/components/ui/skeleton";

interface ArchiveGridSkeletonProps {
  count?: number;
  largeColumns?: 5 | 6;
}

export function ArchiveCardSkeleton() {
  return (
    <article className="relative overflow-hidden rounded-xl border border-default bg-surface-raised">
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      <div className="grid grid-rows-[3rem_2.5rem_1.5rem_1.25rem] gap-2 p-3">
        <div className="space-y-1">
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-5 w-2/3" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-2.5 w-full" />
          <Skeleton className="h-2.5 w-3/5" />
        </div>
        <div className="flex items-center gap-1.5">
          <Skeleton className="size-6 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-3 w-20" />
        <div className="pointer-events-none absolute right-3 bottom-3">
          <Skeleton className="size-8 rounded-full" />
        </div>
      </div>
    </article>
  );
}

export function ArchiveGridSkeleton({ count = 8, largeColumns = 6 }: ArchiveGridSkeletonProps) {
  return (
    <div aria-label="아카이브 목록을 불러오는 중입니다." className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${largeColumns === 5 ? "2xl:grid-cols-5" : "2xl:grid-cols-6"}`} role="status">
      {Array.from({ length: count }, (_, index) => <ArchiveCardSkeleton key={index} />)}
    </div>
  );
}
