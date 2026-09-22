"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { CalendarDays, Eye, Play, UserRound } from "lucide-react";

import { CollectedMediaActionsMenu } from "@/components/collected-media-actions-menu";
import { Badge } from "@/components/ui/badge";
import { CollectedMediaExclusionButton } from "@/components/collected-media-exclusion-button";
import {
  RP_AFFILIATION_BADGE_FALLBACK,
  RP_AFFILIATION_BADGE_STYLES,
} from "@/constants/rp-affiliation-badge-styles";
import type { ReplaySession } from "@/features/replays/replay";
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
  session: ReplaySession;
  participantProfileImages?: ReadonlyMap<string, ParticipantProfileImages>;
}

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  month: "long",
  timeZone: "Asia/Seoul",
});

const timeFormatter = new Intl.DateTimeFormat("ko-KR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Seoul",
});

const viewCountFormatter = new Intl.NumberFormat("ko-KR");

export function ReplayCard({ canManageCollectedMedia = false, participantProfileImages, session }: ReplayCardProps) {
  const { isMediaPreviewBlurEnabled, isRpMode } = useRpModeSettings();
  const replay = session.replays[0];
  if (!replay) return null;

  const displayName = replay.participant
    ? getDisplayName(replay.participant, "replay-card", isRpMode)
    : { primaryName: "인물 정보 없음", secondaryName: null };
  const replayTime = session.startedAt ?? replay.publishedAt;
  const shouldBlurThumbnail = shouldBlurMediaPreview(isRpMode, isMediaPreviewBlurEnabled);
  const profileImageUrl = replay.participant
    ? getDisplayProfileImageUrl(
        participantProfileImages?.get(replay.participant.id),
        isRpMode,
      )
    : null;

  const cardContent = (
    <>
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
          {session.replays.length === 1 && replay.durationSeconds !== null ? (
            <Badge className="absolute right-2 bottom-2 bg-black/70 text-white">
              {formatDuration(replay.durationSeconds)}
            </Badge>
          ) : null}
          {replay.seasonDay ? (
            <Badge className="absolute top-2 left-2 bg-black/70 text-white">
              {replay.seasonDay.dayNumber}일차
            </Badge>
          ) : null}
          {session.replays.length > 1 ? (
            <Badge className="absolute bottom-2 left-2 bg-black/70 text-white">
              다시보기 {session.replays.length}개
            </Badge>
          ) : null}
        </div>

        <div className="grid grid-rows-[3rem_2.5rem_1.5rem_1.25rem] gap-2 p-3 text-left">
          <h2 className="line-clamp-2 text-body font-semibold leading-6 text-primary">{replay.title}</h2>

          <div className="flex min-w-0 items-center justify-start gap-2">
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

          <div className="flex min-w-0 justify-start gap-1 overflow-hidden">
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

          <div className="flex items-center justify-between gap-3 text-caption text-secondary">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <CalendarDays aria-hidden="true" className="size-3.5 shrink-0" />
              {session.replays.length > 1 && session.startedAt && session.endedAt
                ? `${dateFormatter.format(new Date(session.startedAt))} ~ ${timeFormatter.format(new Date(session.endedAt))}`
                : replayTime ? dateFormatter.format(new Date(replayTime)) : "방송 시각 정보 없음"}
            </span>
            {session.replays.length === 1 ? (
              <span className="inline-flex shrink-0 items-center gap-1">
                <Eye aria-hidden="true" className="size-3.5" />
                {replay.viewCount === null ? "조회수 정보 없음" : viewCountFormatter.format(replay.viewCount)}
              </span>
            ) : null}
          </div>
        </div>
    </>
  );

  return (
    <article className="group relative h-full min-w-0 overflow-hidden rounded-xl border border-default bg-surface-raised transition-[border-color,box-shadow] duration-fast hover:border-brand hover:shadow-sm focus-within:border-brand focus-within:ring-2 focus-within:ring-focus-ring/40">
      {session.replays.length === 1 ? (
        <a
          aria-label={`${replay.title} 다시보기 보기`}
          className="block cursor-pointer focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-[-2px]"
          href={replay.replayUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          {cardContent}
        </a>
      ) : (
        <DialogPrimitive.Root>
          <DialogPrimitive.Trigger
            aria-label={`${replay.title} 다시보기 ${session.replays.length}개 보기`}
            className="block w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-[-2px]"
          >
            {cardContent}
          </DialogPrimitive.Trigger>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Backdrop className="fixed inset-0 z-modal bg-black/60" />
            <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-modal max-h-[min(80dvh,40rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-default bg-surface-raised p-5 shadow-2xl outline-none">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <DialogPrimitive.Title className="text-heading-sm font-semibold text-primary">
                    다시보기 {session.replays.length}개
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className="mt-1 text-body-sm text-secondary">
                    {session.startedAt && session.endedAt
                      ? `${dateFormatter.format(new Date(session.startedAt))} ~ ${dateFormatter.format(new Date(session.endedAt))}`
                      : "같은 방송의 다시보기를 선택해 보세요."}
                  </DialogPrimitive.Description>
                </div>
                <DialogPrimitive.Close aria-label="닫기" className="cursor-pointer text-secondary hover:text-primary focus-visible:outline-2 focus-visible:outline-focus-ring">✕</DialogPrimitive.Close>
              </div>
              <ol className="mt-5 space-y-2">
                {session.replays.map((item, index) => (
                  <li className="flex items-center gap-2" key={item.id}>
                    <a
                      className="min-w-0 flex-1 rounded-lg border border-default p-3 text-body-sm text-primary hover:border-brand focus-visible:outline-2 focus-visible:outline-focus-ring"
                      href={item.replayUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <span className="font-semibold">{index + 1}. {item.title}</span>
                      <span className="mt-1 block text-caption text-secondary">
                        {item.liveStartedAt ? dateFormatter.format(new Date(item.liveStartedAt)) : "시작 시각 정보 없음"}
                        {item.liveStartedAt && item.durationSeconds !== null
                          ? ` ~ ${dateFormatter.format(new Date(Date.parse(item.liveStartedAt) + item.durationSeconds * 1000))}`
                          : ""}
                      </span>
                    </a>
                    {canManageCollectedMedia ? (
                      <CollectedMediaExclusionButton mediaId={item.id} mediaType="replay" variant="menu" />
                    ) : null}
                  </li>
                ))}
              </ol>
            </DialogPrimitive.Popup>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      )}
      {session.replays.length === 1 && canManageCollectedMedia ? (
        <CollectedMediaActionsMenu label={`${replay.title} 더보기`}>
          <CollectedMediaExclusionButton
            mediaId={replay.id}
            mediaType="replay"
            variant="menu"
          />
        </CollectedMediaActionsMenu>
      ) : null}
    </article>
  );
}

interface ReplayCardGridProps {
  canManageCollectedMedia?: boolean;
  participantProfileImages?: ReadonlyMap<string, ParticipantProfileImages>;
  replays: ReplaySession[];
}

export function ReplayCardGrid({
  canManageCollectedMedia = false,
  participantProfileImages,
  replays,
}: ReplayCardGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
      {replays.map((session) => (
        <ReplayCard
          canManageCollectedMedia={canManageCollectedMedia}
          key={session.id}
          participantProfileImages={participantProfileImages}
          session={session}
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
