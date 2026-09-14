"use client";

import { PlayCircle } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export function TimelineClipThumbnail({
  alt,
  thumbnailUrl,
}: {
  alt: string;
  thumbnailUrl: string | null;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const canShowThumbnail = thumbnailUrl && failedUrl !== thumbnailUrl;

  return (
    <span className="absolute inset-0 grid place-items-center overflow-hidden bg-black/70 text-white">
      {canShowThumbnail ? (
        <Image
          fill
          unoptimized
          alt={alt}
          className="object-cover"
          onError={() => setFailedUrl(thumbnailUrl)}
          sizes="144px"
          src={thumbnailUrl}
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
