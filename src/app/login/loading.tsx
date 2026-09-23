import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="relative isolate flex min-h-full items-center justify-center overflow-hidden px-4 py-8 md:px-6 lg:px-8">
      <section aria-label="로그인 화면을 불러오는 중입니다." className="w-full max-w-lg rounded-2xl border border-brand/50 bg-surface-raised/95 p-5 shadow-sm sm:p-8" role="status">
        <div className="mb-6 flex flex-col items-center gap-3"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-36" /><Skeleton className="h-5 w-64 max-w-full" /></div>
        <div className="space-y-5"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-12 w-full" /></div>
      </section>
    </main>
  );
}
