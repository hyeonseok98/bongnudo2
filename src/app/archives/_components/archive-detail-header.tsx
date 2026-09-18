"use client";

import Link from "next/link";
import { CalendarDays, ChevronLeft, FolderOpen, Pencil, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { ArchiveDetail, ArchiveSystemClipSummary } from "@/features/archives/archive";
import { getDisplayName } from "@/features/rp-mode/rp-mode";
import { useRpModeSettings } from "@/providers/rp-mode-provider";

interface ArchiveDetailHeaderProps {
  archive: ArchiveDetail;
  systemSummary?: ArchiveSystemClipSummary;
}

const categoryLabels = {
  character: "인물",
  incident: "사건",
  series: "시리즈",
  other: "기타",
} as const;

const statusLabels = { completed: "완료", ongoing: "진행 중" } as const;

const updatedAtFormatter = new Intl.DateTimeFormat("ko-KR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Seoul",
});

export function ArchiveDetailHeader({ archive, systemSummary }: ArchiveDetailHeaderProps) {
  const { isRpMode } = useRpModeSettings();
  const systemDisplayName = archive.systemParticipant
    ? getDisplayName(archive.systemParticipant, "clip-card", isRpMode)
    : null;
  const title = archive.archiveKind === "system_character" && systemDisplayName
    ? `${systemDisplayName.primaryName} 전체 클립 아카이브`
    : archive.title;
  const clipCount = archive.archiveKind === "system_character"
    ? systemSummary?.clipCount
    : archive.chapters.reduce((count, chapter) => count + chapter.items.length, 0);
  const detail = archive.archiveKind === "system_character"
    ? systemSummary?.firstClipCreatedAt && systemSummary.lastClipCreatedAt
      ? `${formatClipRange(systemSummary.firstClipCreatedAt, systemSummary.lastClipCreatedAt)} 기록`
      : "기록 기간 정보 없음"
    : `${archive.chapters.length}개 챕터`;

  return (
    <header className="flex flex-col gap-5 border-b border-default py-8 sm:py-10">
      <nav aria-label="아카이브 경로">
        <Link className="inline-flex items-center gap-1 text-body-sm text-secondary hover:text-primary" href="/archives">
          <ChevronLeft aria-hidden="true" className="size-4" />
          아카이브 목록으로 돌아가기
        </Link>
      </nav>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{categoryLabels[archive.category]}</Badge>
            <Badge variant="outline">{statusLabels[archive.status]}</Badge>
            <Badge variant="outline">
              {archive.archiveKind === "system_character" ? "시스템 인물" : "사용자 제작"}
            </Badge>
            <Badge variant="outline">{archive.visibility === "public" ? "공개" : "비공개"}</Badge>
          </div>
          <h1 className="break-keep text-hero font-bold text-primary">{title}</h1>
          {archive.description ? <p className="max-w-3xl text-body text-secondary">{archive.description}</p> : null}
        </div>
        {archive.canEditContent || archive.canEditMetadata ? (
          <Link className={buttonVariants({ variant: "outline" })} href={`/archives/${archive.id}/edit`}>
            <Pencil aria-hidden="true" />
            편집하기
          </Link>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-body-sm text-secondary">
        {archive.creatorName ? <span className="inline-flex items-center gap-1.5"><UserRound aria-hidden="true" className="size-4" />{archive.creatorName}</span> : null}
        {clipCount !== undefined ? <span className="inline-flex items-center gap-1.5"><FolderOpen aria-hidden="true" className="size-4" />클립 {clipCount}개</span> : null}
        <span>{detail}</span>
        <span className="inline-flex items-center gap-1.5"><CalendarDays aria-hidden="true" className="size-4" />최종 수정 {updatedAtFormatter.format(new Date(archive.updatedAt))}</span>
      </div>
    </header>
  );
}

function formatClipRange(first: string, last: string): string {
  const formatter = new Intl.DateTimeFormat("ko-KR", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Seoul",
  });

  return `${formatter.format(new Date(first))} ~ ${formatter.format(new Date(last))}`;
}
