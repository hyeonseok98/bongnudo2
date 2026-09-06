import type { Metadata } from "next";

import { CharactersBanner } from "./_components/characters-banner";
import { CharactersContent } from "./_components/characters-content";

export const metadata: Metadata = {
  title: "인물 도감 | 봉누도2",
  description: "봉누도2에서 살아가는 인물들을 확인해보세요.",
  alternates: {
    canonical: "/characters",
  },
};

export default function CharactersPage() {
  return (
    <main className="space-y-6 py-5 sm:py-6 lg:py-8">
      <CharactersBanner />
      <CharactersContent />
    </main>
  );
}
