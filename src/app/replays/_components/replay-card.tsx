"use client";

import { Eye, Play, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CollectedMediaExclusionButton } from "@/components/collected-media-exclusion-button";
import type { ReplayItem } from "@/features/replays/replay";
import { getDisplayName } from "@/features/rp-mode/rp-mode";
import { useRpModeSettings } from "@/providers/rp-mode-provider";

interface ReplayCardProps {
  canManageCollectedMedia?: boolean;
  replay: ReplayItem;
  onExcluded?: () => void;
}

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  month: "long",
  timeZone: "Asia/Seoul",
});

const viewCountFormatter = new Intl.NumberFormat("ko-KR");

export function ReplayCard({ canManageCollectedMedia = false, onExcluded, replay }: ReplayCardProps) {
  const { isRpMode } = useRpModeSettings();
  const displayName = replay.participant
    ? getDisplayName(replay.participant, "replay-card", isRpMode)
    : { primaryName: "인물 정보 없음", secondaryName: null };
  const replayTime = replay.liveStartedAt ?? replay.publishedAt;

  return (
    <article className="group min-w-0 overflow-hidden rounded-xl border border-default bg-surface-raised transition-[background-color,border-color] duration-fast hover:border-brand dark:hover:bg-surface-selected">
      <a
        aria-label={`${replay.title} 다시보기 보기`}
        className="block h-full focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-[-2px]"
        href={replay.replayUrl}
        rel="noopener noreferrer"
        target="_blank"
      >
        <div className="relative aspect-video overflow-hidden bg-surface-muted">
          {replay.thumbnailUrl ? (
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-cover bg-center transition-transform duration-default group-hover:scale-[1.02]"
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
        </div>

        <div className="space-y-2.5 p-3">
          <h2 className="line-clamp-2 text-body-sm font-semibold text-primary">{replay.title}</h2>

          <div className="flex min-w-0 items-center gap-2">
            {replay.participant?.profileImageUrl ? (
              <span
                aria-hidden="true"
                className="size-7 shrink-0 rounded-full bg-cover bg-center"
                style={{ backgroundImage: `url(${JSON.stringify(replay.participant.profileImageUrl)})` }}
              />
            ) : (
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-muted text-tertiary">
                <UserRound aria-hidden="true" className="size-4" />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-body-sm font-semibold text-primary">{displayName.primaryName}</p>
              {displayName.secondaryName ? (
                <p className="truncate text-caption text-secondary">{displayName.secondaryName}</p>
              ) : null}
            </div>
          </div>

          {replay.historicalAffiliations.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {replay.historicalAffiliations.map((affiliation) => (
                <Badge key={`${affiliation.organizationSlug}:${affiliation.role ?? ""}`} variant="outline">
                  {affiliation.organizationName}
                  {affiliation.role ? ` · ${affiliation.role}` : ""}
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-2 text-caption text-tertiary">
            <span>{replayTime ? dateFormatter.format(new Date(replayTime)) : "방송 시각 정보 없음"}</span>
            <span className="inline-flex items-center gap-1">
              <Eye aria-hidden="true" className="size-3.5" />
              {replay.viewCount === null ? "조회수 정보 없음" : viewCountFormatter.format(replay.viewCount)}
            </span>
          </div>
        </div>
      </a>
      {canManageCollectedMedia && onExcluded ? (
        <CollectedMediaExclusionButton mediaId={replay.id} mediaType="replay" onExcluded={onExcluded} />
      ) : null}
    </article>
  );
}

interface ReplayCardGridProps {
  canManageCollectedMedia?: boolean;
  onExcluded?: () => void;
  replays: ReplayItem[];
}

export function ReplayCardGrid({
  canManageCollectedMedia = false,
  onExcluded,
  replays,
}: ReplayCardGridProps) {
  return (
    <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
      {replays.map((replay) => (
        <ReplayCard
          canManageCollectedMedia={canManageCollectedMedia}
          key={replay.id}
          onExcluded={onExcluded}
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
