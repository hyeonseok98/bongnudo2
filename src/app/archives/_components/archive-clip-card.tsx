"use client";

import { Play, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ArchiveClipSummary } from "@/features/archives/archive";
import {
  getDisplayName,
  MEDIA_PREVIEW_BLUR_CLASS,
  shouldBlurMediaPreview,
} from "@/features/rp-mode/rp-mode";
import { useRpModeSettings } from "@/providers/rp-mode-provider";
import { cn } from "@/utils/cn";

interface ArchiveClipCardProps {
  clip: ArchiveClipSummary;
  note?: string | null;
  onPreview: () => void;
}

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  day: "numeric",
  month: "long",
  timeZone: "Asia/Seoul",
});

export function ArchiveClipCard({ clip, note = null, onPreview }: ArchiveClipCardProps) {
  const { isMediaPreviewBlurEnabled, isRpMode } = useRpModeSettings();
  const displayName = clip.participant
    ? getDisplayName(clip.participant, "clip-card", isRpMode)
    : { primaryName: "인물 정보 없음", secondaryName: null };
  const shouldBlurThumbnail = shouldBlurMediaPreview(isRpMode, isMediaPreviewBlurEnabled);

  return (
    <article className="group overflow-hidden rounded-xl border border-default bg-surface-raised transition-[background-color,border-color] duration-fast hover:border-brand dark:hover:bg-surface-selected">
      <button
        aria-label={`${clip.title} 미리보기`}
        className="block w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-[-2px]"
        onClick={onPreview}
        type="button"
      >
        <div className="relative aspect-video overflow-hidden bg-surface-muted">
          {clip.thumbnailUrl ? (
            <div
              aria-hidden="true"
              className={cn(
                "absolute inset-0 bg-cover bg-center transition-transform duration-default group-hover:scale-[1.02]",
                shouldBlurThumbnail && MEDIA_PREVIEW_BLUR_CLASS,
              )}
              style={{ backgroundImage: `url(${JSON.stringify(clip.thumbnailUrl)})` }}
            />
          ) : null}
          <span className="absolute inset-0 grid place-items-center bg-black/20 text-white">
            <Play aria-hidden="true" className="size-9 fill-current" />
          </span>
          {clip.seasonDay ? (
            <Badge className="absolute top-2 left-2 bg-black/70 text-white">
              봉누도 {clip.seasonDay.dayNumber}일차
            </Badge>
          ) : null}
        </div>

        <div className="space-y-2 p-3">
          <h3 className="line-clamp-2 text-body-sm font-semibold text-primary">
            {clip.title}
          </h3>
          <div className="flex min-w-0 items-center gap-2">
            {clip.participant?.profileImageUrl ? (
              <span
                aria-hidden="true"
                className="size-7 shrink-0 rounded-full bg-cover bg-center"
                style={{ backgroundImage: `url(${JSON.stringify(clip.participant.profileImageUrl)})` }}
              />
            ) : (
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-muted text-tertiary">
                <UserRound aria-hidden="true" className="size-4" />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-body-sm font-medium text-primary">{displayName.primaryName}</p>
              {displayName.secondaryName ? (
                <p className="truncate text-caption text-secondary">{displayName.secondaryName}</p>
              ) : null}
            </div>
          </div>
          {note ? <p className="line-clamp-2 text-caption text-secondary">{note}</p> : null}
          <p className="text-caption text-tertiary">{dateFormatter.format(new Date(clip.clipCreatedAt))}</p>
        </div>
      </button>
    </article>
  );
}
