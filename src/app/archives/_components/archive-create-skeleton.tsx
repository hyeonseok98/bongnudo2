import { Skeleton } from "@/components/ui/skeleton";

export function ArchiveCreateSkeleton() {
  return (
    <div className="mx-auto max-w-3xl py-5 sm:py-6 lg:py-8">
      <Skeleton className="h-8 w-28" />
      <header className="mt-4">
        <p className="text-body-sm font-medium text-brand-text">사용자 제작 아카이브</p>
        <h1 className="mt-1 text-title font-bold text-primary">새 아카이브 만들기</h1>
        <p className="mt-2 text-body-sm text-secondary">기본 정보를 정한 뒤 클립을 담아 나만의 기록을 만들어보세요.</p>
      </header>
      <ol aria-label="아카이브 제작 단계" className="mt-6 grid grid-cols-2 gap-3">
        <li className="rounded-lg border border-brand bg-surface-selected px-4 py-3 text-body-sm font-semibold text-primary"><span className="mr-2 text-brand-text">1</span>기본 정보</li>
        <li className="rounded-lg border border-default px-4 py-3 text-body-sm font-medium text-secondary"><span className="mr-2">2</span>클립 구성</li>
      </ol>
      <div aria-label="아카이브 작성 양식을 불러오는 중입니다." className="mt-5 space-y-6 rounded-xl border border-default bg-surface-raised p-5 sm:p-6" role="status">
        <div className="space-y-2"><Skeleton className="h-4 w-12" /><Skeleton className="h-10 w-full" /></div>
        <div className="space-y-2"><Skeleton className="h-4 w-12" /><Skeleton className="h-24 w-full" /></div>
        <div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-10 w-full" /></div><div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-10 w-full" /></div></div>
        <div className="flex justify-between border-t border-default pt-5"><Skeleton className="h-9 w-16" /><Skeleton className="h-9 w-32" /></div>
      </div>
    </div>
  );
}
