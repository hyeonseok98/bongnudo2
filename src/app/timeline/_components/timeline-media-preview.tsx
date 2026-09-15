"use client";

import Image from "next/image";

import type { TimelineMedia } from "@/features/timeline/timeline";
import { orderTimelineMedia } from "@/features/timeline/timeline-media";

import { TimelineClipThumbnail } from "./timeline-clip-thumbnail";

interface TimelineMediaPreviewProps {
  eventTitle: string;
  media: TimelineMedia[];
  onOpen: (mediaId: string) => void;
}

export function TimelineMediaPreview({
  eventTitle,
  media,
  onOpen,
}: TimelineMediaPreviewProps) {
  const preview = orderTimelineMedia(media)[0];
  if (!preview) return null;

  return (
    <button
      aria-label={`${eventTitle} 상세 보기`}
      className="relative hidden aspect-video w-32 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-default bg-surface-inset hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring md:block xl:w-36"
      onClick={(clickEvent) => {
        clickEvent.stopPropagation();
        onOpen(preview.id);
      }}
      type="button"
    >
      {preview.mediaType === "image" ? (
        <Image
          fill
          alt="타임라인 첨부 이미지"
          className="object-cover"
          sizes="144px"
          src={preview.imageUrl}
        />
      ) : (
        <TimelineClipThumbnail
          alt={`${eventTitle} 치지직 클립 썸네일`}
          clipUrl={preview.clipUrl}
          thumbnailUrl={preview.thumbnailUrl}
        />
      )}
      {media.length > 1 ? (
        <span className="absolute right-2 bottom-2 rounded-md bg-black/75 px-2 py-1 text-caption font-semibold text-white">
          +{media.length - 1}
        </span>
      ) : null}
    </button>
  );
}
