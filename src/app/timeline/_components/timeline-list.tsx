"use client";

import Image from "next/image";
import {
  ChevronDown,
  Flag,
  ImageIcon,
  PlayCircle,
  UsersRound,
} from "lucide-react";
import { useState } from "react";

import { CharacterAvatar } from "@/app/characters/_components/character-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TimelineEvent, TimelineMedia } from "@/features/timeline/timeline";
import { cn } from "@/utils/cn";

const CONTENT_PREVIEW_LENGTH = 90;
const VISIBLE_PARTICIPANT_COUNT = 3;
const VISIBLE_TAG_COUNT = 3;

interface TimelineListProps {
  events: TimelineEvent[];
  onMediaOpen: (eventId: string, mediaId: string) => void;
  onRequestCorrection?: (eventId: string) => void;
  onTagChange: (tagSlug: string) => void;
}

export function TimelineList({
  events,
  onMediaOpen,
  onRequestCorrection,
  onTagChange,
}: TimelineListProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-default bg-surface-raised">
      <div className="hidden grid-cols-[5rem_8rem_minmax(0,1fr)_14rem_12rem] gap-4 border-b border-default bg-surface-muted px-4 py-3 text-caption font-semibold text-secondary md:grid">
        <span>시간</span>
        <span>분류</span>
        <span>내용</span>
        <span>관련 인물</span>
        <span>태그</span>
      </div>
      <ol className="divide-y divide-border-default">
        {events.map((event) => (
          <TimelineRow
            event={event}
            key={event.id}
            onMediaOpen={onMediaOpen}
            onRequestCorrection={onRequestCorrection}
            onTagChange={onTagChange}
          />
        ))}
      </ol>
    </div>
  );
}

interface TimelineRowProps {
  event: TimelineEvent;
  onMediaOpen: (eventId: string, mediaId: string) => void;
  onRequestCorrection?: (eventId: string) => void;
  onTagChange: (tagSlug: string) => void;
}

function TimelineRow({
  event,
  onMediaOpen,
  onRequestCorrection,
  onTagChange,
}: TimelineRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLongContent = event.content.length > CONTENT_PREVIEW_LENGTH;
  const previewMedia = getPreviewMedia(event.media);
  const visibleParticipants = event.participants.slice(
    0,
    VISIBLE_PARTICIPANT_COUNT,
  );
  const hiddenParticipantCount =
    event.participants.length - visibleParticipants.length;
  const visibleTags = event.tags.slice(0, VISIBLE_TAG_COUNT);
  const hiddenTagCount = event.tags.length - visibleTags.length;
  const contentId = `timeline-content-${event.id}`;

  return (
    <li className="grid gap-4 px-4 py-5 transition-colors duration-default hover:bg-surface-muted md:grid-cols-[5rem_8rem_minmax(0,1fr)_14rem_12rem] md:items-start">
      <time
        className="text-body-sm font-semibold text-primary"
        dateTime={event.occurredAt}
      >
        {formatKstTime(event.occurredAt)}
      </time>

      <div>
        <TimelineCategoryBadge categorySlug={event.category.slug}>
          {event.category.name}
        </TimelineCategoryBadge>
      </div>

      <article
        aria-labelledby={`${contentId}-title`}
        className="min-w-0 space-y-3"
      >
        <div className="space-y-1.5">
          <h3
            className="text-body font-semibold text-primary"
            id={`${contentId}-title`}
          >
            {event.title}
          </h3>
          <div className="flex items-start gap-1">
            <p
              className={cn(
                "min-w-0 flex-1 whitespace-pre-wrap text-body-sm text-secondary",
                isLongContent && !isExpanded && "line-clamp-2",
              )}
              id={contentId}
            >
              {event.content}
            </p>
            {isLongContent ? (
              <button
                aria-controls={contentId}
                aria-expanded={isExpanded}
                aria-label={isExpanded ? "내용 접기" : "내용 펼치기"}
                className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-md text-tertiary transition-colors duration-default hover:bg-surface-selected hover:text-primary"
                onClick={() => setIsExpanded((current) => !current)}
                type="button"
              >
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    "size-4 transition-transform duration-default",
                    isExpanded && "rotate-180",
                  )}
                />
              </button>
            ) : null}
          </div>
        </div>

        {previewMedia ? (
          <MediaPreview
            eventTitle={event.title}
            media={previewMedia}
            onOpen={() => onMediaOpen(event.id, previewMedia.id)}
          />
        ) : null}

        <div className="flex flex-wrap items-center gap-3 text-caption text-tertiary">
          <span className="inline-flex items-center gap-1" title="연결된 제보 수">
            <Flag aria-hidden="true" className="size-3.5" />
            제보 {event.reportCount}건
          </span>
          {event.media.length > 1 ? (
            <span className="inline-flex items-center gap-1">
              <ImageIcon aria-hidden="true" className="size-3.5" />
              미디어 {event.media.length}개
            </span>
          ) : null}
          {onRequestCorrection ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRequestCorrection(event.id)}
            >
              정정 요청
            </Button>
          ) : null}
        </div>
      </article>

      <div className="space-y-2">
        <span className="text-caption font-semibold text-tertiary md:sr-only">
          관련 인물
        </span>
        {visibleParticipants.length > 0 ? (
          <ul className="space-y-2">
            {visibleParticipants.map((participant) => {
              const name = participant.rpName ?? participant.streamerName;

              return (
                <li
                  className="flex min-w-0 items-center gap-2"
                  key={participant.seasonParticipantId}
                >
                  <CharacterAvatar
                    className="size-8 rounded-full border border-default"
                    name={name}
                    profileImageUrl={participant.profileImageUrl}
                    sizes="32px"
                  />
                  <span className="min-w-0 truncate text-body-sm font-medium text-primary">
                    {name}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <span className="inline-flex items-center gap-1 text-body-sm text-tertiary">
            <UsersRound aria-hidden="true" className="size-4" />
            연결된 인물 없음
          </span>
        )}
        {hiddenParticipantCount > 0 ? (
          <p className="text-caption text-tertiary">
            외 {hiddenParticipantCount}명
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <span className="text-caption font-semibold text-tertiary md:sr-only">
          태그
        </span>
        {visibleTags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {visibleTags.map((tag) => (
              <button
                className="cursor-pointer rounded-md bg-surface-muted px-2 py-1 text-caption font-medium text-secondary transition-colors duration-default hover:bg-surface-selected hover:text-primary"
                key={tag.slug}
                onClick={() => onTagChange(tag.slug)}
                type="button"
              >
                #{tag.name}
              </button>
            ))}
            {hiddenTagCount > 0 ? (
              <span className="px-1 py-1 text-caption text-tertiary">
                +{hiddenTagCount}
              </span>
            ) : null}
          </div>
        ) : (
          <span className="text-body-sm text-tertiary">태그 없음</span>
        )}
      </div>
    </li>
  );
}

export function TimelineCategoryBadge({
  categorySlug,
  children,
}: {
  categorySlug: string;
  children: string;
}) {
  const categoryClassNames: Record<string, string> = {
    "incident-accident": "text-status-danger",
    daily: "text-status-info",
    humor: "text-status-warning",
    "romance-relationship": "text-job-ems",
    "job-economy": "text-status-success",
    promotion: "text-brand-text",
    "organization-news": "text-job-police",
    "notice-guide": "text-job-city-hall",
    other: "text-secondary",
  };

  return (
    <Badge
      className={categoryClassNames[categorySlug] ?? "text-secondary"}
      variant="outline"
    >
      {children}
    </Badge>
  );
}

function MediaPreview({
  eventTitle,
  media,
  onOpen,
}: {
  eventTitle: string;
  media: TimelineMedia;
  onOpen: () => void;
}) {
  if (media.mediaType === "image") {
    return (
      <button
        aria-label={eventTitle + " 미디어 상세 보기"}
        className="relative block aspect-video w-full max-w-xl cursor-zoom-in overflow-hidden rounded-lg border border-default bg-surface-muted transition-[border-color,opacity] duration-default hover:border-brand hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none"
        onClick={onOpen}
        type="button"
      >
        <Image
          fill
          alt="타임라인 첨부 이미지"
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 576px"
          src={media.imageUrl}
        />
      </button>
    );
  }

  return (
    <button
      aria-label={eventTitle + " CHZZK 클립 상세 보기"}
      className="flex aspect-video w-full max-w-xl cursor-pointer items-center justify-center rounded-lg border border-default bg-surface-inset text-secondary transition-[border-color,background-color] duration-default hover:border-brand hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none"
      onClick={onOpen}
      type="button"
    >
      <span className="flex flex-col items-center gap-2 text-body-sm font-medium">
        <PlayCircle aria-hidden="true" className="size-8 text-brand-text" />
        CHZZK 클립
      </span>
    </button>
  );
}

function getPreviewMedia(media: TimelineMedia[]): TimelineMedia | null {
  return (
    media.find((candidate) => candidate.mediaType === "image") ??
    media[0] ??
    null
  );
}

function formatKstTime(occurredAt: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(occurredAt));
}
