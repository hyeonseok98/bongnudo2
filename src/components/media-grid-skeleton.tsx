import { Skeleton } from "@/components/ui/skeleton";

interface MediaGridSkeletonProps {
  count?: number;
}

export function FilterBarSkeleton() {
  return (
    <div aria-label="필터를 준비하는 중입니다." className="flex flex-wrap gap-2" role="status">
      <Skeleton className="h-9 w-28" />
      <Skeleton className="h-9 w-24" />
      <Skeleton className="h-9 w-28" />
      <Skeleton className="h-9 w-28" />
      <Skeleton className="h-9 min-w-48 flex-1 sm:max-w-sm" />
    </div>
  );
}

export function MediaCardSkeleton() {
  return (
    <article className="overflow-hidden rounded-xl border border-default bg-surface-raised">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="size-7 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-10" />
        </div>
      </div>
    </article>
  );
}

export function MediaGridSkeleton({ count = 24 }: MediaGridSkeletonProps) {
  return (
    <div aria-label="미디어 목록을 불러오는 중입니다." className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6" role="status">
      {Array.from({ length: count }, (_, index) => <MediaCardSkeleton key={index} />)}
    </div>
  );
}
