import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main aria-label="내 아카이브를 불러오는 중입니다." className="space-y-6 py-5 sm:py-6 lg:py-8" role="status">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2"><Skeleton className="h-10 w-48" /><Skeleton className="h-6 w-72 max-w-full" /></div>
        <Skeleton className="h-10 w-36" />
      </header>
      <div className="flex flex-wrap gap-2"><Skeleton className="h-10 w-24" /><Skeleton className="h-10 w-28" /><Skeleton className="h-10 w-24" /></div>
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, index) => (
          <article className="grid overflow-hidden rounded-xl border border-default bg-surface-raised sm:grid-cols-[11rem_minmax(0,1fr)]" key={index}>
            <Skeleton className="aspect-video w-full rounded-none sm:aspect-auto" />
            <div className="flex flex-col gap-4 p-4 sm:p-5"><div className="space-y-3"><Skeleton className="h-6 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/5" /><Skeleton className="h-3 w-20" /></div><div className="flex gap-2"><Skeleton className="h-9 w-16" /><Skeleton className="h-9 w-16" /><Skeleton className="h-9 w-16" /></div></div>
          </article>
        ))}
      </div>
    </main>
  );
}
