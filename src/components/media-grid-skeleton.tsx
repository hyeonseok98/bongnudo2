import { Skeleton } from "@/components/ui/skeleton";

interface MediaGridSkeletonProps {
  count?: number;
}

interface FilterBarSkeletonProps {
  includeTagFilter?: boolean;
}

interface MediaResultsSkeletonProps {
  hasToolbarActions?: boolean;
}

export function FilterBarSkeleton({ includeTagFilter = false }: FilterBarSkeletonProps) {
  return (
    <div aria-label="필터를 준비하는 중입니다." className="flex flex-wrap items-center gap-4" role="status">
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-10 w-44" />
      <Skeleton className="h-10 w-36" />
      <Skeleton className="h-10 w-36" />
      <Skeleton className="h-10 w-56" />
      {includeTagFilter ? <Skeleton className="h-10 w-56" /> : null}
    </div>
  );
}

export function MediaCardSkeleton() {
  return (
    <article className="overflow-hidden rounded-xl border border-default bg-surface-raised">
      <div className="relative aspect-video">
        <Skeleton className="absolute inset-0 rounded-none" />
        <Skeleton className="absolute top-2 left-2 h-5 w-12" />
        <Skeleton className="absolute top-2 right-2 size-8" />
        <Skeleton className="absolute right-2 bottom-2 h-5 w-10" />
      </div>
      <div className="grid grid-rows-[3rem_2.5rem_1.5rem_1.25rem] gap-2 p-3">
        <div className="space-y-1">
          <Skeleton className="h-5 w-11/12" />
          <Skeleton className="h-5 w-2/3" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="size-7 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <div className="flex items-center">
          <Skeleton className="h-5 w-12" />
        </div>
        <div className="flex items-center justify-between">
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

export function MediaResultsSkeleton({ hasToolbarActions = false }: MediaResultsSkeletonProps) {
  return (
    <section aria-label="미디어 결과를 불러오는 중입니다." className="space-y-4" role="status">
      <div className="flex min-h-10 items-center justify-between gap-3">
        <Skeleton className="h-4 w-36" />
        {hasToolbarActions ? (
          <div className="flex gap-2">
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-32" />
          </div>
        ) : null}
      </div>
      <MediaGridSkeleton />
    </section>
  );
}
