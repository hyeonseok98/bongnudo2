"use client";

import { CalendarDays, Eye, Play, UserRound } from "lucide-react";

import { CollectedMediaActionsMenu } from "@/components/collected-media-actions-menu";
import { Badge } from "@/components/ui/badge";
import { CollectedMediaExclusionButton } from "@/components/collected-media-exclusion-button";
import {
  RP_AFFILIATION_BADGE_FALLBACK,
  RP_AFFILIATION_BADGE_STYLES,
} from "@/constants/rp-affiliation-badge-styles";
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
    <article className="group relative h-full min-w-0 overflow-hidden rounded-xl border border-default bg-surface-raised transition-[border-color,box-shadow] duration-fast hover:border-brand hover:shadow-sm focus-within:border-brand focus-within:ring-2 focus-within:ring-focus-ring/40">
      <button
        aria-label={`${clip.title} 클립 보기`}
        className="block w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-[-2px]"
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

        <div className="grid grid-rows-[3rem_2.5rem_1.5rem_1.25rem] gap-2 p-3 text-left">
          <h2 className="line-clamp-2 text-body font-semibold leading-6 text-primary">
            {clip.title}
          </h2>

          <div className="flex min-w-0 items-center justify-start gap-2">
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
            <div className="min-w-0 text-left">
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

          <div className="flex min-w-0 justify-start gap-1 overflow-hidden">
            {clip.historicalAffiliations.length > 0 ? (
              clip.historicalAffiliations.map((affiliation) => (
                <div className="flex shrink-0 gap-1" key={`${affiliation.organizationSlug}:${affiliation.role ?? ""}`}>
                  <Badge
                    className={cn(
                      (
                        RP_AFFILIATION_BADGE_STYLES[affiliation.organizationSlug] ??
                        RP_AFFILIATION_BADGE_FALLBACK
                      ).surface,
                    )}
                  >
                    {affiliation.organizationName}
                  </Badge>
                  {affiliation.role ? (
                    <Badge
                      className={cn(
                        (
                          RP_AFFILIATION_BADGE_STYLES[affiliation.organizationSlug] ??
                          RP_AFFILIATION_BADGE_FALLBACK
                        ).surface,
                      )}
                    >
                      {affiliation.role}
                    </Badge>
                  ) : null}
                </div>
              ))
            ) : (
              <Badge className={RP_AFFILIATION_BADGE_STYLES.citizen.surface}>
                시민
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 text-caption text-secondary">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <CalendarDays aria-hidden="true" className="size-3.5 shrink-0" />
              {dateFormatter.format(new Date(clip.clipCreatedAt))}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1">
              <Eye aria-hidden="true" className="size-3.5" />
              {clip.viewCount === null ? "조회수 정보 없음" : viewCountFormatter.format(clip.viewCount)}
            </span>
          </div>
        </div>
      </button>
      {canAddTags || canManageCollectedMedia ? (
        <CollectedMediaActionsMenu label={`${clip.title} 더보기`}>
          <ClipTagEditor
            canAddTags={canAddTags}
            clipId={clip.id}
            tags={clip.tags}
          />
          {canManageCollectedMedia ? (
            <CollectedMediaExclusionButton
              mediaId={clip.id}
              mediaType="clip"
              variant="menu"
            />
          ) : null}
        </CollectedMediaActionsMenu>
      ) : null}
    </article>
  );
}

interface ClipCardGridProps {
  canAddTags?: boolean;
  canManageCollectedMedia?: boolean;
  clips: ClipItem[];
  onPreview: (clip: ClipItem) => void;
  participantProfileImages?: ReadonlyMap<string, ParticipantProfileImages>;
}

export function ClipCardGrid({
  canAddTags = false,
  canManageCollectedMedia = false,
  clips,
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
