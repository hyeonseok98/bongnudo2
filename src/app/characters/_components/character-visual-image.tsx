"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useState, useSyncExternalStore } from "react";

import { cn } from "@/utils/cn";

interface CharacterVisualImageProps {
  className?: string;
  darkSrc: string;
  lightSrc: string;
  priority?: boolean;
  sizes: string;
}

export function CharacterVisualImage({
  className,
  darkSrc,
  lightSrc,
  priority,
  sizes,
}: CharacterVisualImageProps) {
  const { resolvedTheme } = useTheme();
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const [loadedImageUrl, setLoadedImageUrl] = useState<string | null>(null);
  const src = isHydrated
    ? resolvedTheme === "light"
      ? lightSrc
      : darkSrc
    : null;
  const hasImageFailed = src !== null && failedImageUrl === src;
  const isImageLoaded = src !== null && loadedImageUrl === src;
  const shouldShowImage = src !== null && !hasImageFailed;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {!isImageLoaded && !hasImageFailed ? (
        <span
          className="absolute inset-0 overflow-hidden"
          data-slot="character-visual-loading"
        >
          <span className="animate-profile-image-shimmer absolute inset-y-0 -left-1/2 w-1/2">
            <span className="absolute inset-0 -skew-x-12 bg-linear-to-r from-transparent via-brand/10 to-transparent dark:via-white/10" />
          </span>
        </span>
      ) : null}
      {shouldShowImage ? (
        <Image
          fill
          alt=""
          className={cn(
            "transition-opacity duration-slow motion-reduce:transition-none",
            isImageLoaded ? "opacity-100" : "opacity-0",
            className,
          )}
          onError={() => {
            setFailedImageUrl(src);
            setLoadedImageUrl(null);
          }}
          onLoad={() => setLoadedImageUrl(src)}
          priority={priority}
          sizes={sizes}
          src={src}
        />
      ) : null}
    </div>
  );
}

function subscribeToHydration() {
  return () => {};
}

function getClientHydrationSnapshot() {
  return true;
}

function getServerHydrationSnapshot() {
  return false;
}
