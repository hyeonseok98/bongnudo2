import { FilterBarSkeleton, MediaResultsSkeleton } from "@/components/media-grid-skeleton";

export default function Loading() {
  return (
    <main className="space-y-6 py-5 sm:py-6 lg:py-8">
      <div><h1 className="text-title font-bold text-primary">다시보기</h1><p className="mt-1 text-body text-secondary">봉누도2 참가자의 방송을 다시보기로 찾아보세요.</p></div>
      <FilterBarSkeleton />
      <MediaResultsSkeleton />
    </main>
  );
}
