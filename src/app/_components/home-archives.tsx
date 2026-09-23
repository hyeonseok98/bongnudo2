"use client";

import { useArchives } from "@/app/archives/_hooks/use-archives";
import { ArchiveGridSkeleton } from "@/components/archive-grid-skeleton";
import type { ArchiveListFilters } from "@/features/archives/archive";

import { ArchiveCard } from "../archives/_components/archive-card";
import { HomeSectionHeader, HomeSectionMessage } from "./home-section";

const HOME_ARCHIVE_COUNT = 4;

const HOME_ARCHIVE_FILTERS: ArchiveListFilters = {
  category: null,
  participantId: null,
  query: "",
  sort: "updated",
  status: null,
  type: "all",
};

export function HomeArchives() {
  const archivesQuery = useArchives(HOME_ARCHIVE_FILTERS);
  const archives = archivesQuery.data?.pages[0]?.items.slice(0, HOME_ARCHIVE_COUNT) ?? [];

  return (
    <section aria-labelledby="home-archives-heading" className="space-y-4">
      <HomeSectionHeader
        description="봉누도2의 이야기를 아카이브로 읽어보세요."
        headingId="home-archives-heading"
        href="/archives"
        title="아카이브"
      />
      {archivesQuery.isPending ? <ArchiveGridSkeleton count={HOME_ARCHIVE_COUNT} largeColumns={5} /> : null}
      {archivesQuery.isError ? (
        <HomeSectionMessage isError>아카이브를 불러오지 못했습니다.</HomeSectionMessage>
      ) : null}
      {!archivesQuery.isPending && !archivesQuery.isError && archives.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {archives.map((archive) => <ArchiveCard archive={archive} key={archive.id} />)}
        </div>
      ) : null}
      {!archivesQuery.isPending && !archivesQuery.isError && archives.length === 0 ? (
        <HomeSectionMessage>아직 공개된 아카이브가 없습니다.</HomeSectionMessage>
      ) : null}
    </section>
  );
}
