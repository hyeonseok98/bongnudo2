import Image from "next/image";

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

  return (
    <div
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden bg-surface-muted text-title font-semibold text-tertiary",
        className,
      )}
    >
      {character.profileImageUrl ? (
        <Image
          fill
          alt={`${character.streamerName} 프로필`}
          className="object-cover"
          sizes={sizes}
          src={character.profileImageUrl}
        />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
    </div>
  );
}
