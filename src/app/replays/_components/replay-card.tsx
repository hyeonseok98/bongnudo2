"use client";

import { CalendarDays, Eye, Play, UserRound } from "lucide-react";

import { CollectedMediaActionsMenu } from "@/components/collected-media-actions-menu";
import { Badge } from "@/components/ui/badge";
import { CollectedMediaExclusionButton } from "@/components/collected-media-exclusion-button";
import {
  RP_AFFILIATION_BADGE_FALLBACK,
  RP_AFFILIATION_BADGE_STYLES,
} from "@/constants/rp-affiliation-badge-styles";
import type { ReplayItem } from "@/features/replays/replay";
import {
  getDisplayName,
  getDisplayProfileImageUrl,
  MEDIA_PREVIEW_BLUR_CLASS,
  type ParticipantProfileImages,
  shouldBlurMediaPreview,
} from "@/features/rp-mode/rp-mode";
import { useRpModeSettings } from "@/providers/rp-mode-provider";
import { cn } from "@/utils/cn";

interface ReplayCardProps {
  canManageCollectedMedia?: boolean;
  replay: ReplayItem;
  onExcluded?: () => void;
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

export function ReplayCard({ canManageCollectedMedia = false, onExcluded, participantProfileImages, replay }: ReplayCardProps) {
  const { isMediaPreviewBlurEnabled, isRpMode } = useRpModeSettings();
  const displayName = replay.participant
    ? getDisplayName(replay.participant, "replay-card", isRpMode)
    : { primaryName: "인물 정보 없음", secondaryName: null };
  const replayTime = replay.liveStartedAt ?? replay.publishedAt;
  const shouldBlurThumbnail = shouldBlurMediaPreview(isRpMode, isMediaPreviewBlurEnabled);
  const profileImageUrl = replay.participant
    ? getDisplayProfileImageUrl(
        participantProfileImages?.get(replay.participant.id),
        isRpMode,
      )
    : null;

  return (
    <article className="group relative h-full min-w-0 overflow-hidden rounded-xl border border-default bg-surface-raised transition-[border-color,box-shadow] duration-fast hover:border-brand hover:shadow-sm focus-within:border-brand focus-within:ring-2 focus-within:ring-focus-ring/40">
      <a
        aria-label={`${replay.title} 다시보기 보기`}
        className="block cursor-pointer focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-[-2px]"
        href={replay.replayUrl}
        rel="noopener noreferrer"
        target="_blank"
      >
        <div className="relative aspect-video overflow-hidden bg-surface-muted">
          {replay.thumbnailUrl ? (
            <div
              aria-hidden="true"
              className={cn(
                "absolute inset-0 bg-cover bg-center transition-transform duration-default group-hover:scale-[1.02]",
                shouldBlurThumbnail && MEDIA_PREVIEW_BLUR_CLASS,
              )}
              style={{ backgroundImage: `url(${JSON.stringify(replay.thumbnailUrl)})` }}
            />
          ) : (
            <div className="grid h-full place-items-center text-tertiary">
              <Play aria-hidden="true" className="size-8" />
            </div>
          )}
          {replay.durationSeconds !== null ? (
            <Badge className="absolute right-2 bottom-2 bg-black/70 text-white">
              {formatDuration(replay.durationSeconds)}
            </Badge>
          ) : null}
          {replay.seasonDay ? (
            <Badge className="absolute top-2 left-2 bg-black/70 text-white">
              {replay.seasonDay.dayNumber}일차
            </Badge>
          ) : null}
        </div>

        <div className="grid grid-rows-[3rem_2.5rem_1.5rem_1.25rem] gap-2 p-3 text-center">
          <h2 className="line-clamp-2 flex items-center justify-center text-body font-semibold leading-6 text-primary">{replay.title}</h2>

          <div className="flex min-w-0 items-center justify-center gap-2">
            {profileImageUrl ? (
              <span
                aria-hidden="true"
                className="size-7 shrink-0 rounded-full bg-cover bg-center"
                style={{ backgroundImage: `url(${JSON.stringify(profileImageUrl)})` }}
              />
            ) : (
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-muted text-tertiary">
                <UserRound aria-hidden="true" className="size-4" />
              </span>
            )}
            <div className="min-w-0 text-left">
              <p className="truncate text-body-sm font-semibold text-primary">{displayName.primaryName}</p>
              {displayName.secondaryName ? (
                <p className="truncate text-caption text-secondary">{displayName.secondaryName}</p>
              ) : null}
            </div>
          </div>

          <div className="flex min-w-0 justify-center gap-1 overflow-hidden">
            {replay.historicalAffiliations.length > 0 ? (
              replay.historicalAffiliations.map((affiliation) => (
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

          <div className="flex items-center justify-center gap-3 text-caption text-secondary">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <CalendarDays aria-hidden="true" className="size-3.5 shrink-0" />
              {replayTime ? dateFormatter.format(new Date(replayTime)) : "방송 시각 정보 없음"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye aria-hidden="true" className="size-3.5" />
              {replay.viewCount === null ? "조회수 정보 없음" : viewCountFormatter.format(replay.viewCount)}
            </span>
          </div>
        </div>
      </a>
      {canManageCollectedMedia && onExcluded ? (
        <CollectedMediaActionsMenu label={`${replay.title} 더보기`}>
          <CollectedMediaExclusionButton
            mediaId={replay.id}
            mediaType="replay"
            onExcluded={onExcluded}
            variant="menu"
          />
        </CollectedMediaActionsMenu>
      ) : null}
    </article>
  );
}

interface ReplayCardGridProps {
  canManageCollectedMedia?: boolean;
  onExcluded?: () => void;
  participantProfileImages?: ReadonlyMap<string, ParticipantProfileImages>;
  replays: ReplayItem[];
}

export function ReplayCardGrid({
  canManageCollectedMedia = false,
  onExcluded,
  participantProfileImages,
  replays,
}: ReplayCardGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
      {replays.map((replay) => (
        <ReplayCard
          canManageCollectedMedia={canManageCollectedMedia}
          key={replay.id}
          onExcluded={onExcluded}
          participantProfileImages={participantProfileImages}
          replay={replay}
        />
      ))}
    </div>
  );
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;
}
