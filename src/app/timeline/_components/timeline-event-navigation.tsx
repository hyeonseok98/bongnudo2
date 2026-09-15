"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { orderTimelineMedia } from "@/features/timeline/timeline-media";
import type { TimelineEvent } from "@/features/timeline/timeline";

import { formatTimelineDateTime } from "./timeline-date-time";
import { TimelineClipThumbnail } from "./timeline-clip-thumbnail";

interface TimelineEventNavigationButtonProps {
  direction: "previous" | "next";
  event: TimelineEvent | null;
  isLoading: boolean;
  onClick: (event: TimelineEvent) => void;
}

export function TimelineEventNavigationButton({
  direction,
  event,
  isLoading,
  onClick,
}: TimelineEventNavigationButtonProps) {
  const isPrevious = direction === "previous";
  const previewMedia = event ? orderTimelineMedia(event.media)[0] : null;

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
      {event ? (
        <span className="relative hidden aspect-video w-20 shrink-0 overflow-hidden rounded-md bg-surface-inset sm:block">
          {previewMedia?.mediaType === "image" ? (
            <Image
              fill
              alt=""
              className="object-cover"
              sizes="80px"
              src={previewMedia.imageUrl}
            />
          ) : previewMedia?.mediaType === "chzzk_clip" ? (
            <TimelineClipThumbnail
              alt=""
              clipUrl={previewMedia.clipUrl}
              thumbnailUrl={previewMedia.thumbnailUrl}
            />
          ) : (
            <Image
              alt=""
              className="size-full object-contain p-3 opacity-70"
              height={40}
              src="/logo/bongnurok_logo.png"
              width={80}
            />
          )}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block text-caption font-medium text-tertiary">
          {isPrevious ? "이전 기록" : "다음 기록"}
        </span>
        <span className="block max-w-48 truncate text-body-sm font-semibold text-primary">
          {event?.title ?? (isLoading ? "기록을 불러오는 중" : "이동할 기록 없음")}
        </span>
        {event ? (
          <time className="block text-caption text-secondary" dateTime={event.occurredAt}>
            {formatTimelineDateTime(event.occurredAt)}
          </time>
        ) : null}
      </span>
      {!isPrevious ? <ChevronRight aria-hidden="true" /> : null}
    </button>
  );
}
