"use client";

import Link from "next/link";
import { Clapperboard, FolderArchive } from "lucide-react";

import type { ArchiveListItem } from "@/features/archives/archive";
import {
  getDisplayName,
  getDisplayProfileImageUrl,
  MEDIA_PREVIEW_BLUR_CLASS,
  shouldBlurMediaPreview,
} from "@/features/rp-mode/rp-mode";
import { useRpModeSettings } from "@/providers/rp-mode-provider";
import { CharacterAvatar } from "@/app/characters/_components/character-avatar";
import { cn } from "@/utils/cn";

import { ArchiveRecommendationButton } from "./archive-recommendation-button";

interface ArchiveCardProps {
  archive: ArchiveListItem;
}

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
    <article className="group relative h-full min-w-0 overflow-hidden rounded-xl border border-default bg-surface-raised transition-[border-color,box-shadow] duration-fast hover:border-brand hover:shadow-sm focus-within:border-brand focus-within:ring-2 focus-within:ring-focus-ring/40">
      <Link
        aria-label={`${title} 열기`}
        className="block cursor-pointer focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-[-2px]"
        href={`/archives/${archive.id}`}
      >
        <div className="relative aspect-video overflow-hidden bg-surface-muted">
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
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-secondary">
              <FolderArchive aria-hidden="true" className="size-6" />
              <p className="text-caption">대표 장면이 아직 없습니다</p>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-black/55 to-transparent" />
          <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 text-caption font-medium text-white">
            <Clapperboard aria-hidden="true" className="size-3.5" />
            클립 {archive.clipCount}개
          </span>
        </div>

        <div className="grid grid-rows-[3rem_2.5rem_1.5rem_1.25rem] gap-2 p-3 text-left">
          <h2 className="line-clamp-2 text-body font-semibold leading-6 text-primary">{title}</h2>
          {archive.description ? (
            <p className="line-clamp-2 text-body-sm leading-5 text-secondary">{archive.description}</p>
          ) : <div aria-hidden="true" />}
          {archive.relatedParticipants.length > 0 ? (
            <div className="flex min-w-0 items-center gap-2" aria-label="관련 인물">
              <div className="flex -space-x-1.5">
                {archive.relatedParticipants.map((person) => {
                  const name = getDisplayName(person, "character-card", isRpMode);
                  return <span key={person.id} title={name.primaryName}>
                    <CharacterAvatar className="size-6 rounded-full" name={name.primaryName} sizes="24px" profileImageUrl={getDisplayProfileImageUrl(person, isRpMode)} />
                  </span>;
                })}
              </div>
              <span className="truncate text-body-sm text-secondary">
                {getDisplayName(archive.relatedParticipants[0], "character-card", isRpMode).primaryName}
                {archive.relatedParticipantCount > 1 ? ` 외 ${archive.relatedParticipantCount - 1}명` : ""}
              </span>
            </div>
          ) : <div aria-hidden="true" />}
          <div className="flex min-w-0 items-center pr-14 text-body-sm text-secondary">
            {archive.relatedSeasonDays.length > 0 ? (
              <p className="truncate" title={archive.relatedSeasonDays.map((day) => `${day.dayNumber}일차`).join(" · ")}>
                {archive.relatedSeasonDays.slice(0, 3).map((day) => `${day.dayNumber}일차`).join(" · ")}
                {archive.relatedSeasonDays.length > 3 ? ` 외 ${archive.relatedSeasonDays.length - 3}일` : ""}
              </p>
            ) : null}
          </div>
        </div>
      </Link>
      <ArchiveRecommendationButton
        archiveId={archive.id}
        className="absolute right-3 bottom-3 z-10"
        recommendationCount={archive.recommendationCount}
        recommended={archive.viewerRecommended}
      />
    </article>
  );
}
