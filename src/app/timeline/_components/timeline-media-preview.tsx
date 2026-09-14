"use client";

import { PlayCircle } from "lucide-react";
import Image from "next/image";

import type { TimelineMedia } from "@/features/timeline/timeline";
import { orderTimelineMedia } from "@/features/timeline/timeline-media";

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
      className="relative hidden aspect-video w-40 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-default bg-surface-inset hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring lg:block xl:w-44"
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
          sizes="176px"
          src={preview.imageUrl}
        />
      ) : (
        <span className="grid size-full place-items-center bg-black/70 text-white">
          <span className="flex flex-col items-center gap-1 text-caption font-semibold">
            <PlayCircle
              aria-hidden="true"
              className="size-7 text-brand-text"
            />
            치지직 클립
          </span>
        </span>
      )}
      {media.length > 1 ? (
        <span className="absolute right-2 bottom-2 rounded-md bg-black/75 px-2 py-1 text-caption font-semibold text-white">
          +{media.length - 1}
        </span>
      ) : null}
    </button>
  );
}
