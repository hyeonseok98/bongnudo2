"use client";

import { CalendarDays, Eye, Play, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CollectedMediaExclusionButton } from "@/components/collected-media-exclusion-button";
import type { ClipItem } from "@/features/clips/clip";
import {
  getDisplayName,
  getDisplayProfileImageUrl,
  MEDIA_PREVIEW_BLUR_CLASS,
  type ParticipantProfileImages,
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
  onPreview: (clip: ClipItem) => void;
  participantProfileImages?: ReadonlyMap<string, ParticipantProfileImages>;
}

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  month: "long",
  timeZone: "Asia/Seoul",
});

const viewCountFormatter = new Intl.NumberFormat("ko-KR");

export function ClipCard({
  canAddTags = false,
  canManageCollectedMedia = false,
  clip,
  onExcluded,
  onPreview,
  participantProfileImages,
}: ClipCardProps) {
  const { isMediaPreviewBlurEnabled, isRpMode } = useRpModeSettings();
  const displayName = clip.participant
    ? getDisplayName(clip.participant, "clip-card", isRpMode)
    : { primaryName: "인물 정보 없음", secondaryName: null };
  const shouldBlurThumbnail = shouldBlurMediaPreview(isRpMode, isMediaPreviewBlurEnabled);
  const profileImageUrl = clip.participant
    ? getDisplayProfileImageUrl(
        participantProfileImages?.get(clip.participant.id),
        isRpMode,
      )
    : null;

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-default bg-surface-raised transition-[border-color,box-shadow] duration-fast hover:border-brand hover:shadow-sm focus-within:border-brand focus-within:ring-2 focus-within:ring-focus-ring/40">
      <button
        aria-label={`${clip.title} 클립 보기`}
        className="flex w-full flex-1 cursor-pointer flex-col text-left focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-[-2px]"
        onClick={() => onPreview(clip)}
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
          {clip.seasonDay ? (
            <Badge className="absolute top-2 left-2 bg-black/70 text-white">
              {clip.seasonDay.dayNumber}일차
            </Badge>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-3">
          <h2 className="line-clamp-2 min-h-12 text-body font-semibold leading-snug text-primary">
            {clip.title}
          </h2>

          <div className="flex min-h-10 min-w-0 items-center gap-2">
            {profileImageUrl ? (
              <span
                aria-hidden="true"
                className="size-7 shrink-0 rounded-full bg-cover bg-center"
                style={{
                  backgroundImage: `url(${JSON.stringify(profileImageUrl)})`,
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

          <div className="flex min-h-6 flex-wrap gap-1 overflow-hidden">
            {clip.historicalAffiliations.length > 0 ? (
              clip.historicalAffiliations.map((affiliation) => (
                <Badge key={`${affiliation.organizationSlug}:${affiliation.role ?? ""}`} variant="outline">
                  {affiliation.organizationName}
                  {affiliation.role ? ` · ${affiliation.role}` : ""}
                </Badge>
              ))
            ) : null}
          </div>

          <div className="mt-auto flex items-center justify-between gap-2 text-caption text-secondary">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <CalendarDays aria-hidden="true" className="size-3.5 shrink-0" />
              {dateFormatter.format(new Date(clip.clipCreatedAt))}
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye aria-hidden="true" className="size-3.5" />
              {clip.viewCount === null ? "조회수 정보 없음" : viewCountFormatter.format(clip.viewCount)}
            </span>
          </div>
        </div>
      </button>
      {clip.tags.length > 0 || canAddTags ? (
        <div className="px-3 pb-3">
          <ClipTagEditor canAddTags={canAddTags} clipId={clip.id} tags={clip.tags} />
        </div>
      ) : null}
      {canManageCollectedMedia && onExcluded ? (
        <CollectedMediaExclusionButton mediaId={clip.id} mediaType="clip" onExcluded={onExcluded} />
      ) : null}
    </article>
  );
}

interface ClipCardGridProps {
  canAddTags?: boolean;
  canManageCollectedMedia?: boolean;
  clips: ClipItem[];
  onExcluded?: () => void;
  onPreview: (clip: ClipItem) => void;
  participantProfileImages?: ReadonlyMap<string, ParticipantProfileImages>;
}

export function ClipCardGrid({
  canAddTags = false,
  canManageCollectedMedia = false,
  clips,
  onExcluded,
  onPreview,
  participantProfileImages,
}: ClipCardGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
      {clips.map((clip) => (
        <ClipCard
          canAddTags={canAddTags}
          canManageCollectedMedia={canManageCollectedMedia}
          clip={clip}
          key={clip.id}
          onExcluded={onExcluded}
          onPreview={onPreview}
          participantProfileImages={participantProfileImages}
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
