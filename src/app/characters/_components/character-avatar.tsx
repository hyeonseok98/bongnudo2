"use client";

import Image from "next/image";
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
  const initial = Array.from(name)[0];
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const shouldShowImage =
    profileImageUrl !== null && profileImageUrl !== failedImageUrl;

  return (
    <div
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden bg-surface-muted text-title font-semibold text-tertiary",
        className,
      )}
    >
      <span aria-hidden="true">{initial}</span>
      {shouldShowImage ? (
        <Image
          fill
          alt={`${name} 프로필`}
          className={cn("object-cover", imageClassName)}
          onError={() => setFailedImageUrl(profileImageUrl)}
          sizes={sizes}
          src={profileImageUrl}
        />
      ) : null}
    </div>
  );
}
