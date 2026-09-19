import { ArchiveGridSkeleton } from "@/components/archive-grid-skeleton";
import { FilterBarSkeleton } from "@/components/media-grid-skeleton";

export default function Loading() {
  return (
    <main className="space-y-6 py-5 sm:py-6 lg:py-8">
      <header><h1 className="text-title font-bold text-primary">아카이브</h1><p className="mt-1 text-body text-secondary">봉누도2의 이야기를 만든 기록과 인물별 클립을 찾아보세요.</p></header>
      <FilterBarSkeleton />
      <ArchiveGridSkeleton />
    </main>
  );
}
