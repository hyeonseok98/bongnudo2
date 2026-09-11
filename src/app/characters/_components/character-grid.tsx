import type { CharacterDirectoryItem } from "../_utils/character-directory";

import { CharacterCard } from "./character-card";

interface CharacterGridProps {
  items: CharacterDirectoryItem[];
}

export function CharacterGrid({ items }: CharacterGridProps) {
  return (
    <div
      className="grid items-stretch grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
      data-character-grid
    >
      {items.map((item) => (
        <CharacterCard item={item} key={`${item.kind}:${item.id}`} />
      ))}
    </div>
  );
}
