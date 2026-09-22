"use client";

import Link from "next/link";
import { CalendarDays, Clapperboard, FolderArchive } from "lucide-react";

import type { ArchiveListItem } from "@/features/archives/archive";
import {
  getDisplayName,
  MEDIA_PREVIEW_BLUR_CLASS,
  shouldBlurMediaPreview,
} from "@/features/rp-mode/rp-mode";
import { useRpModeSettings } from "@/providers/rp-mode-provider";
import { cn } from "@/utils/cn";

import { ArchiveRecommendationButton } from "./archive-recommendation-button";

interface ArchiveCardProps {
  archive: ArchiveListItem;
}

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  day: "numeric",
  month: "short",
  timeZone: "Asia/Seoul",
  year: "numeric",
});

export function ArchiveCard({ archive }: ArchiveCardProps) {
  const { isMediaPreviewBlurEnabled, isRpMode } = useRpModeSettings();
  const displayName = archive.systemParticipant
    ? getDisplayName(archive.systemParticipant, "clip-card", isRpMode)
    : null;
  const title = archive.archiveKind === "system_character" && displayName
    ? `${displayName.primaryName} 전체 클립 아카이브`
    : archive.title;
  const shouldBlurThumbnail = shouldBlurMediaPreview(isRpMode, isMediaPreviewBlurEnabled);

  return (
    <article className="group relative overflow-hidden rounded-xl border border-default bg-surface-raised transition-[background-color,border-color,box-shadow] duration-fast hover:border-brand hover:shadow-md dark:hover:bg-surface-selected">
      <Link
        aria-label={`${title} 열기`}
        className="block cursor-pointer focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-[-2px]"
        href={`/archives/${archive.id}`}
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-surface-muted">
          {archive.representativeImageUrl ? (
            <div
              aria-hidden="true"
              className={cn(
                "absolute inset-0 bg-cover bg-center transition-transform duration-default group-hover:scale-[1.02]",
                shouldBlurThumbnail && MEDIA_PREVIEW_BLUR_CLASS,
              )}
              style={{ backgroundImage: `url(${JSON.stringify(archive.representativeImageUrl)})` }}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-tertiary">
              <FolderArchive aria-hidden="true" className="size-10" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-black/55 to-transparent" />
          <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 text-caption font-medium text-white">
            <Clapperboard aria-hidden="true" className="size-3.5" />
            클립 {archive.clipCount}개
          </span>
        </div>

        <div className="space-y-2.5 p-4 pr-16">
          {archive.archiveKind === "system_character" ? (
            <SystemArchiveCardContent archive={archive} displayName={displayName} title={title} />
          ) : (
            <UserArchiveCardContent archive={archive} />
          )}
        </div>
      </Link>
      <ArchiveRecommendationButton
        archiveId={archive.id}
        className="absolute right-4 bottom-4 z-10"
        recommendationCount={archive.recommendationCount}
        recommended={archive.viewerRecommended}
      />
    </article>
  );
}

function SystemArchiveCardContent({
  archive,
  displayName,
  title,
}: {
  archive: ArchiveListItem;
  displayName: ReturnType<typeof getDisplayName> | null;
  title: string;
}) {
  return (
    <>
      <div className="min-w-0">
        <h2 className="line-clamp-2 text-body font-semibold text-primary">{title}</h2>
        {displayName?.secondaryName ? (
          <p className="mt-0.5 truncate text-caption text-secondary">{displayName.secondaryName}</p>
        ) : null}
      </div>
      <p className="text-body-sm text-secondary">이 인물의 봉누도2 클립 기록입니다.</p>
      <p className="inline-flex items-center gap-1.5 text-caption text-tertiary">
        <CalendarDays aria-hidden="true" className="size-3.5" />
        {formatClipRange(archive.firstClipCreatedAt, archive.lastClipCreatedAt)}
      </p>
    </>
  );
}

function UserArchiveCardContent({ archive }: { archive: ArchiveListItem }) {
  return (
    <>
      <h2 className="line-clamp-2 text-body font-semibold text-primary">{archive.title}</h2>
      {archive.description ? <p className="line-clamp-2 text-body-sm leading-5 text-secondary">{archive.description}</p> : null}
    </>
  );
}

function formatClipRange(first: string | null, last: string | null): string {
  if (!first || !last) {
    return "기록 기간 정보 없음";
  }

  return `${dateFormatter.format(new Date(first))} ~ ${dateFormatter.format(new Date(last))}`;
}
