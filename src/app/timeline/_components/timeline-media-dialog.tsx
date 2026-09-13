"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import Image from "next/image";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  PlayCircle,
  X,
} from "lucide-react";
import { useState } from "react";

import { CharacterAvatar } from "@/app/characters/_components/character-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { getChzzkClipEmbedUrl } from "@/features/reports/chzzk-clip";
import {
  getInitialTimelineMediaId,
  getTimelineEventNeighbors,
} from "@/features/timeline/timeline-media";
import type {
  TimelineEvent,
  TimelineMedia,
  TimelineMediaFilter,
} from "@/features/timeline/timeline";
import { cn } from "@/utils/cn";

import { TimelineCategoryBadge } from "./timeline-list";

interface TimelineMediaDialogProps {
  event: TimelineEvent | null;
  eventId: string;
  events: TimelineEvent[];
  isLoading: boolean;
  mediaFilter: TimelineMediaFilter;
  mediaId: string;
  onClose: () => void;
  onEventChange: (eventId: string, mediaId: string) => void;
  onMediaChange: (mediaId: string) => void;
  onMediaFilterChange: (mediaFilter: TimelineMediaFilter) => void;
  onTagChange: (tagSlug: string) => void;
}

export function TimelineMediaDialog({
  event,
  eventId,
  events,
  isLoading,
  mediaFilter,
  mediaId,
  onClose,
  onEventChange,
  onMediaChange,
  onMediaFilterChange,
  onTagChange,
}: TimelineMediaDialogProps) {
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);
  const mediaIndex = event
    ? Math.max(
        event.media.findIndex((media) => media.id === mediaId),
        0,
      )
    : -1;
  const selectedMedia =
    event && mediaIndex >= 0 ? (event.media[mediaIndex] ?? null) : null;
  const previousMedia =
    event && mediaIndex > 0 ? (event.media[mediaIndex - 1] ?? null) : null;
  const nextMedia =
    event && mediaIndex >= 0
      ? (event.media[mediaIndex + 1] ?? null)
      : null;
  const eventNeighbors = event
    ? getTimelineEventNeighbors(events, event.id, mediaFilter)
    : { next: null, previous: null };

  function handleEventChange(nextEvent: TimelineEvent) {
    const nextMediaId = getInitialTimelineMediaId(nextEvent, mediaFilter);

    if (nextMediaId) {
      onEventChange(nextEvent.id, nextMediaId);
    }
  }

  return (
    <DialogPrimitive.Root
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
      open={Boolean(eventId)}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-modal bg-black/75 transition-opacity duration-default data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none" />
        <DialogPrimitive.Popup
          className="fixed top-1/2 left-1/2 z-modal flex h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-6xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-default bg-surface-raised shadow-2xl outline-none transition-[transform,opacity] duration-default data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none"
          finalFocus
        >
          <header className="flex shrink-0 items-center gap-2 border-b border-default px-4 py-3">
            {event ? (
              <>
                <MediaTypeBadge media={selectedMedia} />
                <TimelineCategoryBadge categorySlug={event.category.slug}>
                  {event.category.name}
                </TimelineCategoryBadge>
              </>
            ) : null}
            <DialogPrimitive.Title className="min-w-0 flex-1 truncate text-body font-semibold text-primary">
              {event?.title ?? "타임라인 미디어"}
            </DialogPrimitive.Title>
            {event && selectedMedia ? (
              <span className="text-caption tabular-nums text-secondary">
                {mediaIndex + 1} / {event.media.length}
              </span>
            ) : null}
            <Button
              aria-expanded={isDetailsExpanded}
              aria-label={isDetailsExpanded ? "상세 정보 접기" : "상세 정보 펼치기"}
              onClick={() => setIsDetailsExpanded((current) => !current)}
              size="icon-sm"
              variant="ghost"
            >
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "transition-transform duration-default",
                  isDetailsExpanded && "rotate-180",
                )}
              />
            </Button>
            <DialogPrimitive.Close
              render={
                <Button
                  aria-label="미디어 상세 닫기"
                  size="icon-sm"
                  variant="ghost"
                />
              }
            >
              <X aria-hidden="true" />
            </DialogPrimitive.Close>
          </header>

          <div className="relative min-h-0 flex-1 bg-black">
            {isLoading ? (
              <MediaStatus>미디어를 불러오는 중입니다.</MediaStatus>
            ) : !event ? (
              <MediaStatus>이 타임라인 기록을 찾을 수 없습니다.</MediaStatus>
            ) : !selectedMedia ? (
              <MediaStatus>표시할 미디어가 없습니다.</MediaStatus>
            ) : (
              <>
                <MediaViewer eventTitle={event.title} media={selectedMedia} />
                <MediaArrow
                  direction="previous"
                  disabled={!previousMedia}
                  onClick={() => {
                    if (previousMedia) {
                      onMediaChange(previousMedia.id);
                    }
                  }}
                />
                <MediaArrow
                  direction="next"
                  disabled={!nextMedia}
                  onClick={() => {
                    if (nextMedia) {
                      onMediaChange(nextMedia.id);
                    }
                  }}
                />
              </>
            )}
          </div>

          {event && isDetailsExpanded ? (
            <EventDetails event={event} onTagChange={onTagChange} />
          ) : null}

          {event && event.media.length > 1 ? (
            <MediaThumbnailStrip
              activeMediaId={selectedMedia?.id ?? ""}
              eventTitle={event.title}
              media={event.media}
              onMediaChange={onMediaChange}
            />
          ) : null}

          <footer className="flex shrink-0 flex-col gap-3 border-t border-default bg-surface-raised p-3 sm:flex-row sm:items-center sm:justify-between">
            <div
              aria-label="이벤트 미디어 유형 필터"
              className="flex flex-wrap gap-2"
            >
              {[
                { label: "전체", value: "all" as const },
                { label: "사진", value: "image" as const },
                { label: "클립", value: "clip" as const },
              ].map((option) => (
                <Chip
                  isSelected={mediaFilter === option.value}
                  key={option.value}
                  onClick={() => onMediaFilterChange(option.value)}
                >
                  {option.label}
                </Chip>
              ))}
            </div>
            <div className="grid min-w-0 gap-2 sm:grid-cols-2">
              <EventNavigationButton
                direction="previous"
                event={eventNeighbors.previous}
                onClick={handleEventChange}
              />
              <EventNavigationButton
                direction="next"
                event={eventNeighbors.next}
                onClick={handleEventChange}
              />
            </div>
          </footer>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function MediaViewer({
  eventTitle,
  media,
}: {
  eventTitle: string;
  media: TimelineMedia;
}) {
  if (media.mediaType === "image") {
    return (
      <Image
        fill
        alt={eventTitle + " 첨부 이미지"}
        className="object-contain"
        sizes="(max-width: 768px) calc(100vw - 2rem), 72rem"
        src={media.imageUrl}
      />
    );
  }

  const embedUrl = getChzzkClipEmbedUrl(media.clipUrl);

  if (!embedUrl) {
    return <MediaStatus>클립 주소가 올바르지 않습니다.</MediaStatus>;
  }

  return (
    <iframe
      allow="autoplay; encrypted-media; picture-in-picture"
      allowFullScreen
      className="size-full border-0"
      src={embedUrl}
      title={eventTitle + " 치지직 클립"}
    />
  );
}

function MediaStatus({ children }: { children: string }) {
  return (
    <div
      className="grid size-full place-items-center px-6 text-center text-body-sm text-white/70"
      role="status"
    >
      {children}
    </div>
  );
}

function MediaArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: "previous" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const isPrevious = direction === "previous";

  return (
    <button
      aria-label={isPrevious ? "이전 미디어" : "다음 미디어"}
      className={cn(
        "absolute top-1/2 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-white/20 bg-black/60 text-white transition-colors duration-default hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:pointer-events-none disabled:opacity-25 motion-reduce:transition-none",
        isPrevious ? "left-3" : "right-3",
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {isPrevious ? (
        <ChevronLeft aria-hidden="true" />
      ) : (
        <ChevronRight aria-hidden="true" />
      )}
    </button>
  );
}

function MediaTypeBadge({ media }: { media: TimelineMedia | null }) {
  if (!media) {
    return null;
  }

  return (
    <Badge className="gap-1" variant="outline">
      {media.mediaType === "image" ? (
        <ImageIcon aria-hidden="true" className="size-3.5" />
      ) : (
        <PlayCircle aria-hidden="true" className="size-3.5" />
      )}
      {media.mediaType === "image" ? "사진" : "클립"}
    </Badge>
  );
}

function EventDetails({
  event,
  onTagChange,
}: {
  event: TimelineEvent;
  onTagChange: (tagSlug: string) => void;
}) {
  const primaryParticipant = event.participants.find(
    (participant) => participant.isPrimary,
  );
  const relatedParticipants = event.participants.filter(
    (participant) => !participant.isPrimary,
  );

  return (
    <section className="max-h-64 shrink-0 overflow-y-auto border-t border-default bg-surface-raised px-4 py-3">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-caption text-secondary">
            <time dateTime={event.occurredAt}>
              {formatKstDateTime(event.occurredAt)}
            </time>
            {event.tags.map((tag) => (
              <Chip
                isSelected={false}
                key={tag.slug}
                onClick={() => onTagChange(tag.slug)}
              >
                #{tag.name}
              </Chip>
            ))}
          </div>
          <p className="whitespace-pre-wrap text-body-sm text-secondary">
            {event.content}
          </p>
        </div>
        <div className="space-y-3">
          {primaryParticipant ? (
            <ParticipantSummary
              label="주요 인물"
              participant={primaryParticipant}
            />
          ) : null}
          {relatedParticipants.length > 0 ? (
            <div className="space-y-2">
              <p className="text-caption font-semibold text-tertiary">
                관련 인물
              </p>
              <div className="flex flex-wrap gap-2">
                {relatedParticipants.map((participant) => (
                  <ParticipantChip
                    key={participant.seasonParticipantId}
                    participant={participant}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ParticipantSummary({
  label,
  participant,
}: {
  label: string;
  participant: TimelineEvent["participants"][number];
}) {
  const name = participant.rpName ?? participant.streamerName;

  return (
    <div className="flex items-center gap-2">
      <CharacterAvatar
        className="size-10 rounded-full border border-default"
        name={name}
        profileImageUrl={participant.profileImageUrl}
        sizes="40px"
      />
      <span className="min-w-0">
        <span className="block text-caption font-semibold text-tertiary">
          {label}
        </span>
        <span className="block truncate text-body-sm font-semibold text-primary">
          {name}
        </span>
      </span>
    </div>
  );
}

function ParticipantChip({
  participant,
}: {
  participant: TimelineEvent["participants"][number];
}) {
  const name = participant.rpName ?? participant.streamerName;

  return (
    <span className="inline-flex min-w-0 items-center gap-2 rounded-full border border-default bg-surface-muted pr-3 pl-1">
      <CharacterAvatar
        className="size-7 rounded-full"
        name={name}
        profileImageUrl={participant.profileImageUrl}
        sizes="28px"
      />
      <span className="max-w-32 truncate text-caption font-medium text-primary">
        {name}
      </span>
    </span>
  );
}

function MediaThumbnailStrip({
  activeMediaId,
  eventTitle,
  media,
  onMediaChange,
}: {
  activeMediaId: string;
  eventTitle: string;
  media: TimelineMedia[];
  onMediaChange: (mediaId: string) => void;
}) {
  return (
    <div
      aria-label="첨부 미디어 목록"
      className="flex shrink-0 gap-2 overflow-x-auto border-t border-default bg-surface-inset p-3"
    >
      {media.map((item, index) => (
        <button
          aria-label={`${index + 1}번째 미디어 보기`}
          aria-pressed={item.id === activeMediaId}
          className={cn(
            "relative aspect-video w-24 shrink-0 cursor-pointer overflow-hidden rounded-md border bg-black transition-[border-color,opacity] duration-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none",
            item.id === activeMediaId
              ? "border-brand opacity-100"
              : "border-default opacity-60 hover:opacity-100",
          )}
          key={item.id}
          onClick={() => onMediaChange(item.id)}
          type="button"
        >
          {item.mediaType === "image" ? (
            <Image
              fill
              alt={`${eventTitle} ${index + 1}번째 첨부 이미지`}
              className="object-cover"
              sizes="96px"
              src={item.imageUrl}
            />
          ) : (
            <span className="grid size-full place-items-center text-white">
              <PlayCircle aria-hidden="true" className="size-6" />
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function EventNavigationButton({
  direction,
  event,
  onClick,
}: {
  direction: "previous" | "next";
  event: TimelineEvent | null;
  onClick: (event: TimelineEvent) => void;
}) {
  const isPrevious = direction === "previous";

  return (
    <button
      className="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg border border-default bg-background px-3 py-2 text-left transition-colors duration-default hover:bg-surface-muted disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none"
      disabled={!event}
      onClick={() => {
        if (event) {
          onClick(event);
        }
      }}
      type="button"
    >
      {isPrevious ? <ChevronLeft aria-hidden="true" /> : null}
      <span className="min-w-0 flex-1">
        <span className="block text-caption font-medium text-tertiary">
          {isPrevious ? "이전 기록" : "다음 기록"}
        </span>
        <span className="block max-w-48 truncate text-body-sm font-semibold text-primary">
          {event?.title ?? "이동할 기록 없음"}
        </span>
      </span>
      {!isPrevious ? <ChevronRight aria-hidden="true" /> : null}
    </button>
  );
}

function formatKstDateTime(occurredAt: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(occurredAt));
}
