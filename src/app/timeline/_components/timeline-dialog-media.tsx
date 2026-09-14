"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageIcon, PlayCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getChzzkClipEmbedUrl } from "@/features/reports/chzzk-clip";
import type { TimelineMedia } from "@/features/timeline/timeline";
import { cn } from "@/utils/cn";

import { TimelineClipThumbnail } from "./timeline-clip-thumbnail";

export function TimelineMediaViewer({
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
    return <TimelineMediaStatus>클립 주소가 올바르지 않습니다.</TimelineMediaStatus>;
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

export function TimelineEmptyMediaViewer({ title }: { title: string }) {
  return (
    <div className="grid size-full place-items-center bg-surface-inset px-6 text-center dark:bg-[radial-gradient(circle_at_center,var(--surface-muted),transparent_65%)]">
      <div className="space-y-4">
        <Image
          alt="봉누록"
          className="mx-auto h-auto w-36 opacity-80"
          height={96}
          src="/logo/bongnurok_logo.png"
          width={224}
        />
        <p className="text-body-sm font-medium text-secondary dark:text-white/70">
          {title}
        </p>
      </div>
    </div>
  );
}

export function TimelineMediaStatus({ children }: { children: string }) {
  return (
    <div
      className="grid size-full place-items-center px-6 text-center text-body-sm text-white/70"
      role="status"
    >
      {children}
    </div>
  );
}

export function TimelineMediaArrow({
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

export function TimelineMediaTypeBadge({ media }: { media: TimelineMedia | null }) {
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
      {media.mediaType === "image" ? "사진" : "치지직 클립"}
    </Badge>
  );
}

export function TimelineMediaThumbnailStrip({
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
            <TimelineClipThumbnail
              alt={`${eventTitle} ${index + 1}번째 치지직 클립 썸네일`}
              thumbnailUrl={item.thumbnailUrl}
            />
          )}
        </button>
      ))}
    </div>
  );
}
