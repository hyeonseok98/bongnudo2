"use client";

import { Eye, Play, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CollectedMediaExclusionButton } from "@/components/collected-media-exclusion-button";
import type { ClipItem } from "@/features/clips/clip";
import {
  getDisplayName,
  MEDIA_PREVIEW_BLUR_CLASS,
  shouldBlurMediaPreview,
} from "@/features/rp-mode/rp-mode";
import { useRpModeSettings } from "@/providers/rp-mode-provider";
import { cn } from "@/utils/cn";

import { ClipTagEditor } from "./clip-tag-editor";

interface ClipCardProps {
  canAddTags?: boolean;
  canManageCollectedMedia?: boolean;
  clip: ClipItem;
  onExcluded?: () => void;
}

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  day: "numeric",
  month: "long",
  timeZone: "Asia/Seoul",
});

const viewCountFormatter = new Intl.NumberFormat("ko-KR");

export function ClipCard({
  canAddTags = false,
  canManageCollectedMedia = false,
  clip,
  onExcluded,
}: ClipCardProps) {
  const { isMediaPreviewBlurEnabled, isRpMode } = useRpModeSettings();
  const displayName = clip.participant
    ? getDisplayName(clip.participant, "clip-card", isRpMode)
    : { primaryName: "인물 정보 없음", secondaryName: null };
  const shouldBlurThumbnail = shouldBlurMediaPreview(isRpMode, isMediaPreviewBlurEnabled);

  return (
    <article className="group min-w-0 overflow-hidden rounded-xl border border-default bg-surface-raised transition-[background-color,border-color] duration-fast hover:border-brand dark:hover:bg-surface-selected">
      <a
        aria-label={`${clip.title} 클립 보기`}
        className="block h-full focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-[-2px]"
        href={clip.clipUrl}
        rel="noopener noreferrer"
        target="_blank"
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
          ) : (
            <div className="grid h-full place-items-center text-tertiary">
              <Play aria-hidden="true" className="size-8" />
            </div>
          )}
          {clip.durationSeconds !== null ? (
            <Badge className="absolute right-2 bottom-2 bg-black/70 text-white">
              {formatDuration(clip.durationSeconds)}
            </Badge>
          ) : null}
        </div>

        <div className="space-y-2 p-3">
          <h2 className="line-clamp-2 text-body-sm font-semibold text-primary">
            {clip.title}
          </h2>

          <div className="flex min-w-0 items-center gap-2">
            {clip.participant?.profileImageUrl ? (
              <span
                aria-hidden="true"
                className="size-7 shrink-0 rounded-full bg-cover bg-center"
                style={{
                  backgroundImage: `url(${JSON.stringify(clip.participant.profileImageUrl)})`,
                }}
              />
            ) : (
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-muted text-tertiary">
                <UserRound aria-hidden="true" className="size-4" />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-body-sm font-semibold text-primary">
                {displayName.primaryName}
              </p>
              {displayName.secondaryName ? (
                <p className="truncate text-caption text-secondary">
                  {displayName.secondaryName}
                </p>
              ) : null}
            </div>
          </div>

          {clip.historicalAffiliations.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {clip.historicalAffiliations.map((affiliation) => (
                <Badge key={`${affiliation.organizationSlug}:${affiliation.role ?? ""}`} variant="outline">
                  {affiliation.organizationName}
                  {affiliation.role ? ` · ${affiliation.role}` : ""}
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-2 text-caption text-tertiary">
            <span>{dateFormatter.format(new Date(clip.clipCreatedAt))}</span>
            <span className="inline-flex items-center gap-1">
              <Eye aria-hidden="true" className="size-3.5" />
              {clip.viewCount === null ? "조회수 정보 없음" : viewCountFormatter.format(clip.viewCount)}
            </span>
          </div>
        </div>
      </a>
      <div className="space-y-2 px-3 pb-3">
        <ClipTagEditor canAddTags={canAddTags} clipId={clip.id} tags={clip.tags} />
        {canManageCollectedMedia && onExcluded ? (
          <CollectedMediaExclusionButton mediaId={clip.id} mediaType="clip" onExcluded={onExcluded} />
        ) : null}
      </div>
    </article>
  );
}

interface ClipCardGridProps {
  canAddTags?: boolean;
  canManageCollectedMedia?: boolean;
  clips: ClipItem[];
  onExcluded?: () => void;
}

export function ClipCardGrid({
  canAddTags = false,
  canManageCollectedMedia = false,
  clips,
  onExcluded,
}: ClipCardGridProps) {
  return (
    <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
      {clips.map((clip) => (
        <ClipCard
          canAddTags={canAddTags}
          canManageCollectedMedia={canManageCollectedMedia}
          clip={clip}
          key={clip.id}
          onExcluded={onExcluded}
        />
      ))}
    </div>
  );
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
