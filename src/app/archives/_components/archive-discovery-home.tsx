"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { CharacterAvatar } from "@/app/characters/_components/character-avatar";
import { ArchiveGridSkeleton } from "@/components/archive-grid-skeleton";
import { RetryButton } from "@/components/ui/retry-button";
import { getDisplayName, getDisplayProfileImageUrl } from "@/features/rp-mode/rp-mode";
import { useRpModeSettings } from "@/providers/rp-mode-provider";
import { archiveQueries } from "@/queries/archive-queries";

import { ArchiveCard } from "./archive-card";

const categoryLabels = { character: "인물", incident: "사건", series: "시리즈", other: "기타" };
const entryClassName = "flex min-w-0 cursor-pointer items-center gap-3 rounded-md py-3 text-left transition-colors hover:text-brand-text focus-visible:outline-2 focus-visible:outline-focus-ring";

export function ArchiveDiscoveryHome() {
  const query = useQuery(archiveQueries.home());
  const { isRpMode } = useRpModeSettings();
  const home = query.data;

  if (!home) {
    return query.isError ? (
      <div className="space-y-3 py-8" role="alert">
        <p className="text-body text-status-danger">아카이브를 불러오지 못함.</p>
        <RetryButton isPending={query.isFetching} onRetry={() => void query.refetch()} />
      </div>
    ) : <div className="space-y-10"><ArchiveGridSkeleton count={6} /><ArchiveGridSkeleton count={6} /></div>;
  }

  const featured = home.featured.filter((archive) => archive.recommendationCount > 0);
  const featuredIds = new Set(featured.map((archive) => archive.id));
  const recent = home.recent.filter((archive) => !featuredIds.has(archive.id));
  const people = home.people.filter((person) => person.archiveCount > 0);
  const days = home.days.filter((day) => day.archiveCount > 0);
  const categories = home.categories.filter((category) => category.archiveCount > 0);
  const hasSections = featured.length > 0 || recent.length > 0 || people.length > 0 || days.length > 0 || categories.length > 0;

  if (!hasSections) {
    return <p className="py-6 text-body text-secondary">아직 공개된 아카이브가 없습니다.</p>;
  }

  return (
    <div className="space-y-8">
      {featured.length > 0 ? (
        <DiscoverySection title="지금 주목할 아카이브" description="많이 추천받은 이야기를 만나보세요." href="/archives?sort=recommended">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
            {featured.map((archive) => <ArchiveCard key={archive.id} archive={archive} />)}
          </div>
        </DiscoverySection>
      ) : null}
      {recent.length > 0 ? (
        <DiscoverySection title="최근 공개 아카이브" description="새롭게 공개된 봉누도2의 기록입니다." href="/archives?sort=published">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
            {recent.map((archive) => <ArchiveCard key={archive.id} archive={archive} />)}
          </div>
        </DiscoverySection>
      ) : null}
      {people.length > 0 ? <DiscoverySection title="인물별 아카이브" description="함께 기록된 인물의 이야기를 따라가 보세요." href="/archives?view=people">
        <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {people.map((person) => {
            const name = getDisplayName(person, "character-card", isRpMode);
            return (
              <Link className={entryClassName} key={person.id} href={`/archives?view=people&participant=${person.id}`}>
                <CharacterAvatar className="size-10 rounded-full" name={name.primaryName} sizes="40px" profileImageUrl={getDisplayProfileImageUrl(person, isRpMode)} />
                <div className="min-w-0">
                  <p className="truncate text-body font-semibold">{name.primaryName}</p>
                  <p className="mt-1 text-body-sm text-secondary">관련 아카이브 {person.archiveCount}개</p>
                </div>
              </Link>
            );
          })}
        </div>
      </DiscoverySection> : null}
      {days.length > 0 ? <DiscoverySection title="일자별 주요 기록" description="봉누도 일차에 남겨진 이야기를 찾아보세요." href="/archives?view=day">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 lg:grid-cols-3 2xl:grid-cols-6">
          {days.map((day) => (
            <Link className={entryClassName} key={day.id} href={`/archives?view=day&day=${day.dayNumber}`}>
              <div>
                <p className="text-body font-semibold">{day.dayNumber}일차 <span className="ml-2 text-body-sm font-normal text-secondary">{day.sessionDate.slice(5).replace("-", "/")}</span></p>
                <p className="mt-1 text-body-sm text-secondary">관련 아카이브 {day.archiveCount}개</p>
              </div>
            </Link>
          ))}
        </div>
      </DiscoverySection> : null}
      {categories.length > 0 ? <DiscoverySection title="주제별 아카이브" description="관심 있는 주제로 이야기를 골라보세요.">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 lg:grid-cols-4">
          {categories.map(({ category, archiveCount }) => (
            <Link className={entryClassName} key={category} href={`/archives?category=${category}`}>
              <span className="text-body font-semibold">{categoryLabels[category]}</span>
              <span className="text-body-sm text-secondary">{archiveCount}개</span>
              <ChevronRight aria-hidden="true" className="size-4 text-tertiary" />
            </Link>
          ))}
        </div>
      </DiscoverySection> : null}
    </div>
  );
}

function DiscoverySection({ title, description, href, children }: { title: string; description: string; href?: string; children: ReactNode }) {
  return (
    <section className="space-y-5" aria-label={title}>
      <header className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-heading-sm font-semibold text-primary">{title}</h2>
          <p className="mt-1 text-body-sm text-secondary">{description}</p>
        </div>
        {href ? <Link className="-mr-2 inline-flex min-h-9 shrink-0 items-center gap-1 rounded-md px-2 text-body-sm font-medium text-secondary hover:text-primary focus-visible:outline-2 focus-visible:outline-focus-ring" href={href}>더보기<ChevronRight aria-hidden="true" className="size-4" /></Link> : null}
      </header>
      {children}
    </section>
  );
}
