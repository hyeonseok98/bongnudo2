"use client";

import Image from "next/image";
import { UserRound } from "lucide-react";
import { useState } from "react";

import { cn } from "@/utils/cn";

interface CharacterAvatarProps {
  name: string;
  profileImageUrl: string | null;
  className?: string;
  imageClassName?: string;
  sizes: string;
}

export function CharacterAvatar({
  name,
  profileImageUrl,
  className,
  imageClassName,
  sizes,
}: CharacterAvatarProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const [loadedImageUrl, setLoadedImageUrl] = useState<string | null>(null);
  const hasImageFailed =
    profileImageUrl !== null && profileImageUrl === failedImageUrl;
  const shouldShowImage = profileImageUrl !== null && !hasImageFailed;
  const isImageLoaded =
    profileImageUrl !== null && loadedImageUrl === profileImageUrl;
  const isImageLoading = shouldShowImage && !isImageLoaded;
  const shouldShowFallback = profileImageUrl === null || hasImageFailed;

  return (
    <div
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden bg-linear-to-br from-surface-muted via-surface-raised to-surface-inset text-title font-semibold text-tertiary",
        className,
      )}
    >
      {shouldShowFallback ? (
        <UserRound
          aria-hidden="true"
          className="absolute size-1/3 text-secondary"
        />
      ) : null}
      {isImageLoading ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
          data-slot="character-avatar-loading"
        >
          <span className="animate-profile-image-shimmer absolute inset-y-0 -left-1/2 w-1/2">
            <span className="absolute inset-0 -skew-x-12 bg-linear-to-r from-transparent via-white/15 to-transparent" />
          </span>
        </span>
      ) : null}
      {shouldShowImage ? (
        <Image
          fill
          alt={`${name} 프로필`}
          className={cn(
            "object-cover transition-opacity duration-300",
            isImageLoaded ? "opacity-100" : "opacity-0",
            imageClassName,
          )}
          onError={() => {
            setFailedImageUrl(profileImageUrl);
            setLoadedImageUrl(null);
          }}
          onLoad={() => setLoadedImageUrl(profileImageUrl)}
          sizes={sizes}
          src={profileImageUrl}
        />
      ) : null}
    </div>
  );
}
