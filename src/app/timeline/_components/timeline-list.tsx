"use client";

import { ChevronDown } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { TimelineEvent } from "@/features/timeline/timeline";
import { getInitialTimelineMediaId } from "@/features/timeline/timeline-media";
import { cn } from "@/utils/cn";

import { TimelineMediaPreview } from "./timeline-media-preview";
import { TimelineParticipantStack } from "./timeline-participant-stack";
import { TimelineRowActions } from "./timeline-row-actions";

const VISIBLE_TAG_COUNT = 3;
const TIMELINE_GRID =
  "xl:grid-cols-[4.5rem_7rem_minmax(0,1fr)_12rem_11rem_2.5rem]";

interface TimelineListProps {
  events: TimelineEvent[];
  onEventOpen: (eventId: string, mediaId: string) => void;
  onRequestCorrection?: (eventId: string) => void;
  onTagChange: (tagSlug: string) => void;
}

export function TimelineList({
  events,
  onEventOpen,
  onRequestCorrection,
  onTagChange,
}: TimelineListProps) {
  return (
    <div className="overflow-clip rounded-xl border border-default bg-surface-raised">
      <div
        className={cn(
          "hidden gap-4 border-b border-default bg-surface-muted px-4 py-3 text-center text-body-sm font-semibold text-secondary xl:grid",
          TIMELINE_GRID,
        )}
      >
        <span>시간</span>
        <span>분류</span>
        <span>내용</span>
        <span>관련 인물</span>
        <span>태그</span>
        <span className="sr-only">작업</span>
      </div>
      <ol className="divide-y divide-border-default">
        {events.map((event) => (
          <TimelineRow
            event={event}
            key={event.id}
            onEventOpen={onEventOpen}
            onRequestCorrection={onRequestCorrection}
            onTagChange={onTagChange}
          />
        ))}
      </ol>
    </div>
  );
}

export function TimelineListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      aria-label="타임라인을 불러오는 중"
      className="overflow-clip rounded-xl border border-default bg-surface-raised"
      role="status"
    >
      <div
        className={cn(
          "hidden gap-4 border-b border-default bg-surface-muted px-4 py-3 xl:grid",
          TIMELINE_GRID,
        )}
      >
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton className="h-4 w-12" key={index} />
        ))}
      </div>
      <div className="divide-y divide-border-default">
        {Array.from({ length: count }, (_, index) => (
          <div
            className={cn(
              "grid min-h-28 gap-4 px-4 py-3 xl:items-center",
              TIMELINE_GRID,
            )}
            key={index}
          >
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-7 w-20" />
            <div className="flex gap-3">
              <Skeleton className="hidden aspect-video w-44 shrink-0 md:block" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="size-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface TimelineRowProps {
  event: TimelineEvent;
  onEventOpen: TimelineListProps["onEventOpen"];
  onRequestCorrection?: TimelineListProps["onRequestCorrection"];
  onTagChange: TimelineListProps["onTagChange"];
}

function TimelineRow({
  event,
  onEventOpen,
  onRequestCorrection,
  onTagChange,
}: TimelineRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);
  const visibleTags = event.tags.slice(0, VISIBLE_TAG_COUNT);
  const hiddenTagCount = event.tags.length - visibleTags.length;
  const initialMediaId = getInitialTimelineMediaId(event, "media") ?? "";
  const contentId = `timeline-content-${event.id}`;

  useLayoutEffect(() => {
    if (isExpanded) return;
    const content = contentRef.current;
    if (!content) return;
    const contentNode = content;

    function measure(): void {
      setHasOverflow(
        contentNode.scrollHeight > contentNode.clientHeight + 1,
      );
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(contentNode);
    return () => observer.disconnect();
  }, [event.content, isExpanded]);

  function openEvent(): void {
    onEventOpen(event.id, initialMediaId);
  }

  return (
    <li
      aria-label={`${event.title} 상세 보기`}
      className={cn(
        "grid min-h-28 cursor-pointer gap-4 px-4 py-3 transition-colors duration-default hover:bg-surface-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring xl:items-center",
        TIMELINE_GRID,
      )}
      onClick={openEvent}
      onKeyDown={(keyboardEvent) => {
        if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
          keyboardEvent.preventDefault();
          openEvent();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <time
        className="text-body-sm font-semibold text-primary xl:text-center"
        dateTime={event.occurredAt}
      >
        {formatKstTime(event.occurredAt)}
      </time>
      <div className="xl:text-center">
        <TimelineCategoryBadge categorySlug={event.category.slug}>
          {event.category.name}
        </TimelineCategoryBadge>
      </div>
      <article
        aria-labelledby={`${contentId}-title`}
        className="flex min-w-0 gap-3"
      >
        {event.media.length > 0 ? (
          <TimelineMediaPreview
            eventTitle={event.title}
            media={event.media}
            onOpen={(mediaId) => onEventOpen(event.id, mediaId)}
          />
        ) : null}
        <div className="min-w-0 flex-1 space-y-1.5">
          <h3
            className="text-body font-semibold text-primary"
            id={`${contentId}-title`}
          >
            {event.title}
          </h3>
          <div className="flex items-start gap-1">
            <p
              className={cn(
                "min-w-0 flex-1 whitespace-pre-wrap text-body-sm leading-relaxed text-secondary",
                !isExpanded && "line-clamp-2",
              )}
              id={contentId}
              ref={contentRef}
            >
              {event.content}
            </p>
            {hasOverflow ? (
              <button
                aria-controls={contentId}
                aria-expanded={isExpanded}
                aria-label={isExpanded ? "내용 접기" : "내용 펼치기"}
                className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-md text-tertiary hover:bg-surface-selected hover:text-primary"
                onClick={(clickEvent) => {
                  clickEvent.stopPropagation();
                  setIsExpanded((current) => !current);
                }}
                type="button"
              >
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    "size-4 transition-transform",
                    isExpanded && "rotate-180",
                  )}
                />
              </button>
            ) : null}
          </div>
        </div>
      </article>
      <div className="min-w-0 xl:flex xl:justify-center">
        <TimelineParticipantStack participants={event.participants} />
      </div>
      <div
        className="space-y-2 xl:text-center"
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        <span className="text-caption font-semibold text-tertiary md:sr-only">
          태그
        </span>
        {visibleTags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 xl:justify-center">
            {visibleTags.map((tag) => (
              <button
                className="cursor-pointer rounded-md bg-surface-muted px-2 py-1 text-caption font-medium text-secondary hover:bg-surface-selected hover:text-primary"
                key={tag.slug}
                onClick={() => onTagChange(tag.slug)}
                type="button"
              >
                #{tag.name}
              </button>
            ))}
            {hiddenTagCount > 0 ? (
              <span className="px-1 py-1 text-caption text-secondary">
                +{hiddenTagCount}
              </span>
            ) : null}
          </div>
        ) : (
          <span className="text-body-sm text-secondary">태그 없음</span>
        )}
      </div>
      <TimelineRowActions
        eventId={event.id}
        onRequestCorrection={onRequestCorrection}
        reportCount={event.reportCount}
      />
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
    promotion: "text-brand-text",
    "organization-news": "text-job-police",
    article: "text-status-info",
    crime: "text-status-danger",
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

function formatKstTime(occurredAt: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(occurredAt));
}
