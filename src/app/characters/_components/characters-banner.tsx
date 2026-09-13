import { DirectoryHero } from "@/components/layouts/directory-hero";

import { getCharactersHeroBanner } from "../_utils/character-visual-assets";

export function CharactersBanner() {
  return (
    <DirectoryHero
      darkSrc={getCharactersHeroBanner("dark")}
      lightSrc={getCharactersHeroBanner("light")}
    />
  );
}
