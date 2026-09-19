import { Skeleton } from "@/components/ui/skeleton";

import { ArchiveCreationSteps } from "./archive-creation-steps";

export function ArchiveCreateSkeleton() {
  return (
    <div className="mx-auto max-w-3xl py-5 sm:py-6 lg:py-8">
      <Skeleton className="h-8 w-28" />
      <header className="mt-5">
        <h1 className="text-title font-bold text-primary">새 아카이브 만들기</h1>
        <p className="mt-2 text-body text-secondary">기본 정보를 입력하고 클립을 구성해주세요.</p>
      </header>
      <div className="mt-7"><ArchiveCreationSteps currentStep={1} /></div>
      <div aria-label="아카이브 작성 양식을 불러오는 중입니다." className="mt-6 space-y-7 rounded-xl border border-default bg-surface-raised p-5 sm:p-6" role="status">
        <div className="space-y-2"><Skeleton className="h-4 w-12" /><Skeleton className="h-10 w-full" /></div>
        <div className="space-y-2"><Skeleton className="h-4 w-12" /><Skeleton className="h-24 w-full" /></div>
        <div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-10 w-full" /></div><div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-10 w-full" /></div></div>
        <div className="flex justify-between border-t border-default pt-5"><Skeleton className="h-9 w-16" /><Skeleton className="h-9 w-32" /></div>
      </div>
    </div>
  );
}
