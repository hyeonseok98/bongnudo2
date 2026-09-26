"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Archive,
  CalendarDays,
  FolderHeart,
  LogIn,
  Plus,
  Tags,
  UsersRound,
} from "lucide-react";

import type { ArchiveParticipantSearchResult } from "@/apis/archives/get-archives";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/utils/cn";

import { ArchiveSearch } from "./archive-search";

export type ArchiveExploreView = "all" | "day" | "people" | "topics";

interface ArchiveHeroProps {
  isSignedIn: boolean;
  onParticipantSelect: (participant: ArchiveParticipantSearchResult) => void;
  onSearchChange: (query: string) => void;
  onViewChange: (view: ArchiveExploreView) => void;
  searchValue: string;
  view: ArchiveExploreView;
}

const exploreLinks: Array<{
  icon: typeof Archive;
  label: string;
  value: ArchiveExploreView;
}> = [
  { icon: Archive, label: "전체", value: "all" },
  { icon: CalendarDays, label: "일자별", value: "day" },
  { icon: UsersRound, label: "인물별", value: "people" },
  { icon: Tags, label: "주제별", value: "topics" },
];

export function ArchiveHero({
  isSignedIn,
  onParticipantSelect,
  onSearchChange,
  onViewChange,
  searchValue,
  view,
}: ArchiveHeroProps) {
  const createHref = isSignedIn
    ? "/archives/new"
    : "/login?returnTo=%2Farchives%2Fnew";

  return (
    <header className="relative isolate -mx-4 min-h-[19rem] overflow-hidden bg-surface-raised/35 sm:-mx-6 sm:min-h-[21rem] lg:-mx-8 lg:min-h-[22rem]">
      <div className="absolute inset-0">
        <Image
          alt=""
          className="object-cover"
          fill
          priority
          sizes="100vw"
          src="/banner/city_dusk_dark.webp"
        />
        <div className="absolute inset-0 bg-linear-to-r from-background/95 via-background/65 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-background/80 via-transparent to-transparent" />
      </div>

      <div className="relative mx-auto w-full max-w-400 px-4 py-7 sm:px-6 sm:py-8 lg:px-8 lg:py-9">
        <p className="text-caption font-semibold tracking-[0.2em] text-brand-text">
          BONGNUDO2 ARCHIVE
        </p>
        <h1 className="mt-2 text-title font-bold text-primary sm:text-hero">
          흩어진 순간을, 하나의 이야기로.
        </h1>
        <p className="mt-2 max-w-2xl text-body text-secondary sm:text-body-lg">
          봉누도2의 인물과 사건, 기억에 남은 장면을 아카이브로
          탐색해보세요.
        </p>

        <div className="mt-4 max-w-2xl">
          <ArchiveSearch
            onChange={onSearchChange}
            onParticipantSelect={onParticipantSelect}
            value={searchValue}
          />
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <nav
            aria-label="공개 아카이브 탐색 방식"
            className="flex flex-wrap gap-2"
          >
            {exploreLinks.map((item) => {
              const Icon = item.icon;
              const isSelected = view === item.value;

              return (
                <button
                  aria-current={isSelected ? "page" : undefined}
                  className={cn(
                    "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-body-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-focus-ring",
                    isSelected
                      ? "border-brand bg-brand text-brand-foreground"
                      : "border-default bg-background/90 text-secondary hover:bg-surface-muted hover:text-primary",
                  )}
                  key={item.value}
                  onClick={() => onViewChange(item.value)}
                  type="button"
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex flex-wrap gap-2 sm:ml-auto">
            {isSignedIn ? (
              <Link
                className={buttonVariants({ size: "sm", variant: "outline" })}
                href="/my/archives"
              >
                <FolderHeart aria-hidden="true" />
                내 아카이브
              </Link>
            ) : null}
            <Link className={buttonVariants({ size: "sm" })} href={createHref}>
              {isSignedIn ? (
                <Plus aria-hidden="true" />
              ) : (
                <LogIn aria-hidden="true" />
              )}
              아카이브 만들기
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
