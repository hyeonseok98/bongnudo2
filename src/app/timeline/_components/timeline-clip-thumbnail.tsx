"use client";

import { PlayCircle } from "lucide-react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { timelineQueries } from "@/queries/timeline-queries";

export function TimelineClipThumbnail({
  alt,
  clipUrl,
  thumbnailUrl,
}: {
  alt: string;
  clipUrl: string;
  thumbnailUrl: string | null;
}) {
  const thumbnailQuery = useQuery({
    ...timelineQueries.clipThumbnail(clipUrl),
    enabled: !thumbnailUrl,
  });
  const resolvedThumbnailUrl = thumbnailUrl ?? thumbnailQuery.data ?? null;
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const canShowThumbnail =
    resolvedThumbnailUrl && failedUrl !== resolvedThumbnailUrl;

  return (
    <span className="absolute inset-0 grid place-items-center overflow-hidden bg-black/70 text-white">
      {canShowThumbnail ? (
        <Image
          fill
          unoptimized
          alt={alt}
          className="object-cover"
          onError={() => setFailedUrl(resolvedThumbnailUrl)}
          sizes="144px"
          src={resolvedThumbnailUrl}
        />
      ) : null}
      <span className="absolute inset-0 bg-black/20" />
      <span className="relative grid size-9 place-items-center rounded-full bg-black/65 text-white shadow-sm">
        <PlayCircle aria-hidden="true" className="size-7" />
      </span>
      <span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-white">
        클립
      </span>
    </span>
  );
}
