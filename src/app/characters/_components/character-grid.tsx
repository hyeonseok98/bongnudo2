import type { CharacterListItem } from "@/features/characters/character";

import { CharacterCard } from "./character-card";

interface CharacterGridProps {
  characters: CharacterListItem[];
}

export function CharacterGrid({ characters }: CharacterGridProps) {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
      data-character-grid
    >
      {characters.map((character) => (
        <CharacterCard character={character} key={character.id} />
      ))}
    </div>
  );
}
