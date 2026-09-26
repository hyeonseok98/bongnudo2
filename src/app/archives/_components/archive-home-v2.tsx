"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FolderArchive,
  Sparkles,
  Tags,
  UsersRound,
} from "lucide-react";
import { useRef } from "react";
import type { PointerEvent, ReactNode } from "react";

import type { ArchiveParticipantSearchResult } from "@/apis/archives/get-archives";
import { CharacterAvatar } from "@/app/characters/_components/character-avatar";
import { RetryButton } from "@/components/ui/retry-button";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  ArchiveCategory,
  ArchiveDiscoveryHome,
  ArchiveListItem,
} from "@/features/archives/archive";
import {
  MEDIA_PREVIEW_BLUR_CLASS,
  getDisplayName,
  getDisplayProfileImageUrl,
  shouldBlurMediaPreview,
} from "@/features/rp-mode/rp-mode";
import { useRpModeSettings } from "@/providers/rp-mode-provider";
import { archiveQueries } from "@/queries/archive-queries";
import { cn } from "@/utils/cn";

import { ArchiveHero, type ArchiveExploreView } from "./archive-hero";

interface ArchiveHomeV2Props {
  isSignedIn: boolean;
  onParticipantSelect: (participant: ArchiveParticipantSearchResult) => void;
  onSearchChange: (query: string) => void;
  onViewChange: (view: ArchiveExploreView) => void;
  searchValue: string;
  view: ArchiveExploreView;
}

const categoryDetails: Record<
  ArchiveCategory,
  { icon: typeof BookOpen; label: string }
> = {
  character: { icon: UsersRound, label: "인물" },
  incident: { icon: Sparkles, label: "사건" },
  series: { icon: BookOpen, label: "시리즈" },
  other: { icon: Tags, label: "기타" },
};

export function ArchiveHomeV2(props: ArchiveHomeV2Props) {
  const query = useQuery(archiveQueries.home());

  if (!query.data) {
    return (
      <>
        <ArchiveHero {...props} />
        {query.isError ? (
          <div className="mt-5 space-y-3" role="alert">
            <p className="text-body text-status-danger">아카이브를 불러오지 못함.</p>
            <RetryButton isPending={query.isFetching} onRetry={() => void query.refetch()} />
          </div>
        ) : (
          <ArchiveHomeV2Skeleton />
        )}
      </>
    );
  }

  return (
    <>
      <ArchiveHero {...props} />
      <ArchiveHomeV2Content home={query.data} />
    </>
  );
}

function ArchiveHomeV2Content({ home }: { home: ArchiveDiscoveryHome }) {
  const { isRpMode } = useRpModeSettings();
  const recent = home.recent.slice(0, 5);
  const featured = home.featured.filter((archive) => archive.recommendationCount > 0).slice(0, 3);
  const notable = featured.length > 0
    ? featured
    : recent.slice(1, 4).length > 0
      ? recent.slice(1, 4)
      : recent.slice(0, 3);
  const days = [...home.days].sort((left, right) => left.dayNumber - right.dayNumber);
  const people = home.people.filter((person) => person.archiveCount > 0);
  const categories = home.categories.filter((category) => category.archiveCount > 0);

  if (recent.length === 0 && days.length === 0 && people.length === 0 && categories.length === 0) {
    return (
      <div className="mt-5 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-default bg-surface-raised/45 px-5 py-10 text-center">
        <FolderArchive aria-hidden="true" className="size-8 text-tertiary" />
        <p className="mt-3 text-heading-sm font-semibold text-primary">아직 공개된 아카이브가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-5 lg:space-y-6">
      {days.length > 0 ? <ArchiveDayRail days={days} /> : null}

      {recent.length > 0 ? (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
          <HomePanel
            description="새롭게 공개된 봉누도2의 기록을 먼저 만나보세요."
            href="/archives?sort=published"
            icon={CalendarDays}
            title="최근 공개 아카이브"
          >
            <div className="space-y-2.5">
              {recent[0] ? <FeaturedArchiveCard archive={recent[0]} /> : null}
              {recent.length > 1 ? (
                <div className="grid items-start gap-2 sm:grid-cols-3">
                  {recent.slice(1, 4).map((archive) => <CompactArchiveCard archive={archive} key={archive.id} />)}
                </div>
              ) : null}
            </div>
          </HomePanel>

          <HomePanel
            description="현재 공개된 기록에서 다시 찾은 이야기입니다."
            href={featured.length > 0 ? "/archives?sort=recommended" : undefined}
            icon={Sparkles}
            title="주목할 아카이브"
          >
            <div className="space-y-2.5">
              {notable[0] ? <FeaturedArchiveCard archive={notable[0]} /> : null}
              {notable.length > 1 ? (
                <div className="grid items-start gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                  {notable.slice(1, 4).map((archive) => (
                    <CompactArchiveCard archive={archive} key={archive.id} />
                  ))}
                </div>
              ) : null}
            </div>
          </HomePanel>
        </div>
      ) : null}

      {people.length > 0 ? (
        <HomePanel description="함께 기록된 인물의 이야기를 따라가 보세요." href="/archives?view=people" icon={UsersRound} title="인물별 아카이브">
          <div className="scrollbar-hidden flex snap-x gap-1.5 overflow-x-auto pb-1">
            {people.map((person) => {
              const name = getDisplayName(person, "character-card", isRpMode);
              return (
                <Link
                  className="group flex w-24 shrink-0 snap-start cursor-pointer flex-col items-center rounded-lg px-1.5 py-1 text-center transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-focus-ring sm:w-28"
                  href={`/archives?view=people&participant=${person.id}`}
                  key={person.id}
                >
                  <CharacterAvatar
                    className="size-11 rounded-full ring-1 ring-border-default/70"
                    name={name.primaryName}
                    profileImageUrl={getDisplayProfileImageUrl(person, isRpMode)}
                    sizes="48px"
                  />
                  <p className="mt-1.5 max-w-full truncate text-body-sm font-semibold text-primary group-hover:text-brand-text">
                    {name.primaryName}
                  </p>
                  <p className="text-caption text-secondary">아카이브 {person.archiveCount}개</p>
                </Link>
              );
            })}
          </div>
        </HomePanel>
      ) : null}

      {categories.length > 0 ? (
        <HomePanel description="등록된 주제로 기록을 골라보세요." icon={Tags} id="archive-topics" title="주제별 아카이브">
          <div className="scrollbar-hidden flex snap-x gap-1.5 overflow-x-auto pb-1">
            {categories.map(({ archiveCount, category }) => {
              const detail = categoryDetails[category];
              const Icon = detail.icon;
              return (
                <Link
                  className="group flex h-20 w-32 shrink-0 snap-start flex-col rounded-lg bg-surface-raised/45 p-2.5 transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-focus-ring sm:w-36"
                  href={`/archives?view=topics&category=${category}`}
                  key={category}
                >
                  <Icon aria-hidden="true" className="size-5 text-brand-text" />
                  <div className="mt-auto flex items-center justify-between gap-2">
                    <span className="text-body-sm font-semibold text-primary group-hover:text-brand-text">{detail.label}</span>
                    <span className="text-caption text-secondary">{archiveCount}개</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </HomePanel>
      ) : null}
    </div>
  );
}

interface ArchiveDayRailProps {
  days: ArchiveDiscoveryHome["days"];
}

function ArchiveDayRail({ days }: ArchiveDayRailProps) {
  const latestDayNumber = days.at(-1)?.dayNumber;
  const railRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    frame: null as number | null,
    isDragging: false,
    moved: false,
    pointerType: "" as string,
    startX: 0,
    startScrollLeft: 0,
    targetScrollLeft: 0,
  });

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!railRef.current) return;
    dragRef.current = {
      frame: null,
      isDragging: true,
      moved: false,
      pointerType: event.pointerType,
      startX: event.clientX,
      startScrollLeft: railRef.current.scrollLeft,
      targetScrollLeft: railRef.current.scrollLeft,
    };
    if (event.pointerType === "mouse") {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.isDragging || !railRef.current) return;
    const distance = event.clientX - dragRef.current.startX;
    if (Math.abs(distance) > 4) dragRef.current.moved = true;
    if (dragRef.current.pointerType !== "mouse") return;

    if (dragRef.current.moved) event.preventDefault();
    dragRef.current.targetScrollLeft = dragRef.current.startScrollLeft - distance;
    if (dragRef.current.frame !== null) return;
    dragRef.current.frame = window.requestAnimationFrame(() => {
      if (railRef.current) railRef.current.scrollLeft = dragRef.current.targetScrollLeft;
      dragRef.current.frame = null;
    });
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    dragRef.current.isDragging = false;
    if (dragRef.current.frame !== null) {
      window.cancelAnimationFrame(dragRef.current.frame);
      dragRef.current.frame = null;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function scrollRail(direction: "left" | "right") {
    railRef.current?.scrollBy({ behavior: "smooth", left: direction === "left" ? -360 : 360 });
  }

  return (
    <HomePanel description="운영일을 따라 봉누도2의 기록을 빠르게 찾아보세요." href="/archives?view=day" icon={CalendarDays} title="봉누도 타임라인">
      <div className="relative">
        <button aria-label="이전 일차 보기" className="absolute top-1/2 left-0 z-10 hidden size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-surface-raised/90 text-secondary hover:bg-surface-muted hover:text-primary sm:grid" onClick={() => scrollRail("left")} type="button">
          <ChevronLeft aria-hidden="true" className="size-4" />
        </button>
        <div
          className="scrollbar-hidden cursor-grab touch-pan-x select-none overflow-x-auto px-0 py-1 active:cursor-grabbing sm:px-8"
          onPointerCancel={handlePointerUp}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onDragStart={(event) => event.preventDefault()}
          ref={railRef}
        >
          <div className="relative flex min-w-max py-1">
            <div aria-hidden="true" className="pointer-events-none absolute top-14 right-16 left-16 h-px bg-border-default" />
            {days.map((day) => {
              const isLatest = day.dayNumber === latestDayNumber;
              return (
                <Link
                  aria-label={`${day.dayNumber}일차 관련 아카이브 ${day.archiveCount}개 보기`}
                  className="group relative z-base flex w-32 shrink-0 flex-col items-center px-2 text-center focus-visible:outline-2 focus-visible:outline-focus-ring"
                  href={`/archives?view=day&day=${day.dayNumber}`}
                  key={day.id}
                  onClick={(event) => {
                    if (dragRef.current.moved) {
                      event.preventDefault();
                      dragRef.current.moved = false;
                    }
                  }}
                >
                  <span className="flex h-10 flex-col items-center">
                    <span className={cn("text-body-sm font-semibold", isLatest ? "text-brand-text" : "text-primary")}>
                      {day.dayNumber}일차
                    </span>
                    <span className="mt-0.5 text-body-sm text-secondary">{formatMonthDay(day.sessionDate)}</span>
                  </span>
                  <span className="relative flex h-6 items-center justify-center">
                    <span aria-hidden="true" className={cn("relative z-10 size-3 rounded-full border-2 border-background bg-tertiary transition-transform group-hover:scale-125 group-hover:bg-brand", isLatest && "bg-brand ring-4 ring-brand/15")} />
                  </span>
                  <span className="mt-2 text-caption text-secondary">관련 아카이브 {day.archiveCount}개</span>
                </Link>
              );
            })}
          </div>
        </div>
        <button aria-label="다음 일차 보기" className="absolute top-1/2 right-0 z-10 hidden size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-surface-raised/90 text-secondary hover:bg-surface-muted hover:text-primary sm:grid" onClick={() => scrollRail("right")} type="button">
          <ChevronRight aria-hidden="true" className="size-4" />
        </button>
      </div>
    </HomePanel>
  );
}

interface HomePanelProps {
  children: ReactNode;
  description: string;
  href?: string;
  icon: typeof BookOpen;
  id?: string;
  title: string;
}

function HomePanel({ children, description, href, icon: Icon, id, title }: HomePanelProps) {
  return (
    <section aria-label={title} className="relative" id={id}>
      <header className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Icon aria-hidden="true" className="size-5 shrink-0 text-brand-text" />
            <h2 className="text-heading-sm font-semibold text-primary">{title}</h2>
          </div>
          <p className="mt-1 text-body-sm text-secondary">{description}</p>
        </div>
        {href ? <Link className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-md px-1.5 text-body-sm font-medium text-secondary hover:text-primary focus-visible:outline-2 focus-visible:outline-focus-ring" href={href}>전체보기<ChevronRight aria-hidden="true" className="size-4" /></Link> : null}
      </header>
      {children}
    </section>
  );
}

export function ArchiveHomeV2Skeleton() {
  return (
    <div aria-label="아카이브 홈을 불러오는 중입니다." className="mt-5 space-y-5" role="status">
      <Skeleton className="h-28 rounded-2xl" />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
      <Skeleton className="h-32 rounded-2xl" />
    </div>
  );
}

function FeaturedArchiveCard({ archive }: { archive: ArchiveListItem }) {
  const { isMediaPreviewBlurEnabled, isRpMode } = useRpModeSettings();
  const participant = archive.relatedParticipants[0];
  const displayName = participant ? getDisplayName(participant, "character-card", isRpMode) : null;

  if (!archive.representativeImageUrl) {
    return (
      <article className="flex h-32 min-w-0 overflow-hidden rounded-xl border border-default bg-surface-raised px-4 py-3">
        <Link className="flex min-w-0 flex-1 items-center gap-3 cursor-pointer focus-visible:outline-2 focus-visible:outline-focus-ring" href={`/archives/${archive.id}`}>
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface-muted text-tertiary">
            <FolderArchive aria-hidden="true" className="size-5" />
          </span>
          <span className="min-w-0">
            <h3 className="line-clamp-2 text-body font-semibold leading-5 text-primary">{archive.title}</h3>
            {archive.description ? <p className="mt-1 line-clamp-1 text-caption text-secondary">{archive.description}</p> : null}
            <span className="mt-1 block text-caption text-secondary">클립 {archive.clipCount}개</span>
          </span>
        </Link>
      </article>
    );
  }

  return (
    <article className="grid h-40 min-w-0 grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] overflow-hidden rounded-xl border border-default bg-surface-raised">
      <Link className="block min-h-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-focus-ring" href={`/archives/${archive.id}`}>
        <ArchiveHomeThumbnail
          archive={archive}
          className="h-full"
          isBlurred={shouldBlurMediaPreview(isRpMode, isMediaPreviewBlurEnabled)}
        />
      </Link>
      <Link className="flex min-w-0 cursor-pointer flex-col justify-center gap-2 p-3 text-left transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-focus-ring" href={`/archives/${archive.id}`}>
        <h3 className="line-clamp-2 text-body font-semibold leading-5 text-primary">{archive.title}</h3>
        {archive.description ? <p className="line-clamp-2 text-caption leading-4 text-secondary">{archive.description}</p> : null}
        <div className="mt-auto flex min-w-0 items-center justify-between gap-2 text-caption text-secondary">
          <span className="truncate">{displayName?.primaryName ?? "공개 아카이브"}</span>
          <span className="shrink-0">클립 {archive.clipCount}개</span>
        </div>
      </Link>
    </article>
  );
}

function CompactArchiveCard({ archive }: { archive: ArchiveListItem }) {
  const { isMediaPreviewBlurEnabled, isRpMode } = useRpModeSettings();

  return (
    <article className="grid h-24 min-w-0 grid-cols-[6.5rem_minmax(0,1fr)] overflow-hidden rounded-lg border border-default bg-surface-raised">
      <Link className="block min-h-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-focus-ring" href={`/archives/${archive.id}`}>
        <ArchiveHomeThumbnail
          archive={archive}
          className="h-full"
          isBlurred={shouldBlurMediaPreview(isRpMode, isMediaPreviewBlurEnabled)}
        />
      </Link>
      <Link className="flex min-w-0 cursor-pointer flex-col justify-center gap-1.5 p-3 text-left transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-focus-ring" href={`/archives/${archive.id}`}>
        <h3 className="line-clamp-2 text-body-sm font-semibold leading-4 text-primary">{archive.title}</h3>
        <span className="truncate text-caption text-secondary">클립 {archive.clipCount}개</span>
      </Link>
    </article>
  );
}

function ArchiveHomeThumbnail({ archive, className, isBlurred }: { archive: ArchiveListItem; className?: string; isBlurred: boolean }) {
  return (
    <div className={cn("relative overflow-hidden bg-surface-muted", className)}>
      {archive.representativeImageUrl ? (
        <div
          aria-hidden="true"
          className={cn("absolute inset-0 bg-cover bg-center", isBlurred && MEDIA_PREVIEW_BLUR_CLASS)}
          style={{ backgroundImage: `url(${JSON.stringify(archive.representativeImageUrl)})` }}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-surface-muted px-3 text-center text-caption text-secondary">
          <FolderArchive aria-hidden="true" className="size-4 text-tertiary" />
          <span>클립 {archive.clipCount}개</span>
        </div>
      )}
      {archive.representativeImageUrl && archive.clipCount > 0 ? <span className="absolute right-1.5 bottom-1.5 rounded-md bg-background/85 px-1.5 py-0.5 text-caption text-primary">▣ {archive.clipCount}개</span> : null}
      <div className="absolute inset-0 bg-linear-to-r from-black/20 to-transparent" />
    </div>
  );
}

function formatMonthDay(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)}월 ${Number(day)}일`;
}
