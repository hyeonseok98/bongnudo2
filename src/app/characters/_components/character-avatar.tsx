"use client";

import Image from "next/image";
import { useState } from "react";

import type { CharacterListItem } from "@/features/characters/character";
import { cn } from "@/utils/cn";

interface CharacterAvatarProps {
  character: CharacterListItem;
  className?: string;
  sizes: string;
}

export function CharacterAvatar({
  character,
  className,
  sizes,
}: CharacterAvatarProps) {
  const initial = Array.from(character.streamerName)[0];
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const profileImageUrl = character.profileImageUrl;
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
          alt={`${character.streamerName} 프로필`}
          className="object-cover"
          onError={() => setFailedImageUrl(profileImageUrl)}
          sizes={sizes}
          src={profileImageUrl}
        />
      ) : null}
    </div>
  );
}
