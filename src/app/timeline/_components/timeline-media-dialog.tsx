"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { ChevronDown, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { getTimelineEventNeighbors } from "@/features/timeline/timeline-event-navigation";
import {
  getInitialTimelineMediaId,
  matchesTimelineMediaFilter,
  orderTimelineMedia,
} from "@/features/timeline/timeline-media";
import type { TimelineEvent, TimelineMediaFilter } from "@/features/timeline/timeline";
import { cn } from "@/utils/cn";

import {
  TimelineEmptyMediaViewer,
  TimelineMediaArrow,
  TimelineMediaStatus,
  TimelineMediaThumbnailStrip,
  TimelineMediaTypeBadge,
  TimelineMediaViewer,
} from "./timeline-dialog-media";
import { TimelineEventDetails } from "./timeline-event-details";
import { TimelineEventNavigationButton } from "./timeline-event-navigation";
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
  const orderedMedia = event
    ? orderTimelineMedia(event.media).filter((media) =>
        matchesTimelineMediaFilter(media, mediaFilter),
      )
    : [];
  const mediaIndex = event
    ? Math.max(
        orderedMedia.findIndex((media) => media.id === mediaId),
        0,
      )
    : -1;
  const selectedMedia =
    event && mediaIndex >= 0 ? (orderedMedia[mediaIndex] ?? null) : null;
  const previousMedia =
    event && mediaIndex > 0 ? (orderedMedia[mediaIndex - 1] ?? null) : null;
  const nextMedia =
    event && mediaIndex >= 0
      ? (orderedMedia[mediaIndex + 1] ?? null)
      : null;
  const eventNeighbors = event
    ? getTimelineEventNeighbors(events, event, mediaFilter)
    : { next: null, previous: null };

  function handleEventChange(nextEvent: TimelineEvent) {
    const nextMediaId = getInitialTimelineMediaId(nextEvent, mediaFilter);
    onEventChange(nextEvent.id, nextMediaId ?? "");
  }

  useEffect(() => {
    if (!event) return;
    for (const media of event.media) {
      if (media.mediaType !== "image") continue;
      const image = new window.Image();
      image.src = media.imageUrl;
    }
  }, [event]);

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
                <TimelineCategoryBadge categorySlug={event.category.slug}>
                  {event.category.name}
                </TimelineCategoryBadge>
              </>
            ) : null}
            <DialogPrimitive.Title className="min-w-0 flex-1 truncate text-body font-semibold text-primary">
              {event?.title ?? "타임라인 기록"}
            </DialogPrimitive.Title>
            <TimelineMediaTypeBadge media={selectedMedia} />
            {event && selectedMedia ? (
              <span className="text-caption tabular-nums text-secondary">
                {mediaIndex + 1} / {orderedMedia.length}
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
                  aria-label="타임라인 상세 닫기"
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
              <TimelineMediaStatus>미디어를 불러오는 중입니다.</TimelineMediaStatus>
            ) : !event ? (
              <TimelineMediaStatus>이 타임라인 기록을 찾을 수 없습니다.</TimelineMediaStatus>
            ) : !selectedMedia ? (
              <TimelineEmptyMediaViewer title={event.title} />
            ) : (
              <>
                <TimelineMediaViewer eventTitle={event.title} media={selectedMedia} />
                <TimelineMediaArrow
                  direction="previous"
                  disabled={!previousMedia}
                  onClick={() => {
                    if (previousMedia) {
                      onMediaChange(previousMedia.id);
                    }
                  }}
                />
                <TimelineMediaArrow
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
            <TimelineEventDetails event={event} onTagChange={onTagChange} />
          ) : null}

          {event && event.media.length > 1 ? (
            <TimelineMediaThumbnailStrip
              activeMediaId={selectedMedia?.id ?? ""}
              eventTitle={event.title}
              media={orderedMedia}
              onMediaChange={onMediaChange}
            />
          ) : null}

          <footer className="flex shrink-0 flex-col gap-3 border-t border-default bg-surface-raised p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-caption font-semibold text-secondary">모아보기</span>
              <div aria-label="기록 모아보기 필터" className="flex flex-wrap gap-2">
                {[
                  { label: "전체", value: "all" as const },
                  { label: "클립", value: "clip" as const },
                  { label: "사진", value: "image" as const },
                  { label: "클립+사진", value: "media" as const },
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
            </div>
            <div className="grid min-w-0 gap-2 sm:grid-cols-2">
              <TimelineEventNavigationButton
                direction="previous"
                event={eventNeighbors.previous}
                onClick={handleEventChange}
              />
              <TimelineEventNavigationButton
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
