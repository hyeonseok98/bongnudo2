import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="grid min-h-full place-items-center px-4 py-8">
      <section aria-label="제보 화면을 불러오는 중입니다." className="w-full max-w-2xl rounded-xl border border-default bg-surface-raised p-5 sm:p-6" role="status">
        <header className="mb-6 flex items-center justify-between"><Skeleton className="h-8 w-36" /><Skeleton className="size-9" /></header>
        <div className="space-y-5">
          <div className="flex gap-3"><Skeleton className="h-20 flex-1" /><Skeleton className="h-20 flex-1" /></div>
          <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
          <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-32 w-full" /></div>
          <Skeleton className="h-24 w-full" />
          <div className="flex justify-end"><Skeleton className="h-10 w-28" /></div>
        </div>
      </section>
    </main>
  );
}
