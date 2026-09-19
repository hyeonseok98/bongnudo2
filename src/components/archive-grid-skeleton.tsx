import { Skeleton } from "@/components/ui/skeleton";

interface ArchiveGridSkeletonProps {
  count?: number;
}

export function ArchiveCardSkeleton() {
  return (
    <article className="overflow-hidden rounded-xl border border-default bg-surface-raised">
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      <div className="space-y-2.5 p-4">
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/5" />
        <div className="flex gap-1.5 pt-1">
          <Skeleton className="h-5 w-10" />
          <Skeleton className="h-5 w-12" />
        </div>
      </div>
    </article>
  );
}

export function ArchiveGridSkeleton({ count = 8 }: ArchiveGridSkeletonProps) {
  return (
    <div aria-label="아카이브 목록을 불러오는 중입니다." className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" role="status">
      {Array.from({ length: count }, (_, index) => <ArchiveCardSkeleton key={index} />)}
    </div>
  );
}
