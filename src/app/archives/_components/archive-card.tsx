"use client";

import Link from "next/link";
import { CalendarDays, Clapperboard, FolderArchive, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ArchiveListItem } from "@/features/archives/archive";
import { getDisplayName } from "@/features/rp-mode/rp-mode";
import { useRpModeSettings } from "@/providers/rp-mode-provider";

interface ArchiveCardProps {
  archive: ArchiveListItem;
}

const categoryLabels = {
  character: "인물",
  incident: "사건",
  series: "시리즈",
  other: "기타",
} as const;

const statusLabels = { completed: "완료", ongoing: "진행 중" } as const;

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  day: "numeric",
  month: "short",
  timeZone: "Asia/Seoul",
  year: "numeric",
});

export function ArchiveCard({ archive }: ArchiveCardProps) {
  const { isRpMode } = useRpModeSettings();
  const displayName = archive.systemParticipant
    ? getDisplayName(archive.systemParticipant, "clip-card", isRpMode)
    : null;
  const title = archive.archiveKind === "system_character" && displayName
    ? `${displayName.primaryName} 전체 클립 아카이브`
    : archive.title;

  return (
    <article className="group overflow-hidden rounded-xl border border-default bg-surface-raised transition-[background-color,border-color] duration-fast hover:border-brand dark:hover:bg-surface-selected">
      <Link
        aria-label={`${title} 열기`}
        className="block focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-[-2px]"
        href={`/archives/${archive.id}`}
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-surface-muted">
          {archive.representativeImageUrl ? (
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-cover bg-center transition-transform duration-default group-hover:scale-[1.02]"
              style={{ backgroundImage: `url(${JSON.stringify(archive.representativeImageUrl)})` }}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-tertiary">
              <FolderArchive aria-hidden="true" className="size-10" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-black/55 to-transparent" />
          <Badge className="absolute top-2 left-2 bg-black/65 text-white">
            {archive.archiveKind === "system_character" ? "자동 인물" : "사용자 제작"}
          </Badge>
          <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 text-caption font-medium text-white">
            <Clapperboard aria-hidden="true" className="size-3.5" />
            클립 {archive.clipCount}개
          </span>
        </div>

        <div className="space-y-2.5 p-4">
          {archive.archiveKind === "system_character" ? (
            <SystemArchiveCardContent archive={archive} displayName={displayName} title={title} />
          ) : (
            <UserArchiveCardContent archive={archive} />
          )}
        </div>
      </Link>
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
      <p className="text-body-sm text-secondary">전체 클립 아카이브</p>
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
      {archive.description ? (
        <p className="line-clamp-2 min-h-10 text-caption text-secondary">{archive.description}</p>
      ) : (
        <p className="min-h-10 text-caption text-tertiary">설명이 없습니다.</p>
      )}
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="outline">{categoryLabels[archive.category]}</Badge>
        <Badge variant="outline">{statusLabels[archive.status]}</Badge>
      </div>
      <div className="flex items-center justify-between gap-2 text-caption text-tertiary">
        <span className="inline-flex min-w-0 items-center gap-1.5 truncate">
          <UserRound aria-hidden="true" className="size-3.5 shrink-0" />
          {archive.ownerName ?? "작성자 정보 없음"}
        </span>
        <time dateTime={archive.updatedAt}>수정 {dateFormatter.format(new Date(archive.updatedAt))}</time>
      </div>
    </>
  );
}

function formatClipRange(first: string | null, last: string | null): string {
  if (!first || !last) {
    return "기록 기간 정보 없음";
  }

  return `${dateFormatter.format(new Date(first))} ~ ${dateFormatter.format(new Date(last))}`;
}
