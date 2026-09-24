import type { Metadata } from "next";

import { CharactersBanner } from "./_components/characters-banner";
import { CharactersContent } from "./_components/characters-content";

export const metadata: Metadata = {
  title: "인물 도감",
  description: "봉누도2 RP 캐릭터와 스트리머 정보를 찾아볼 수 있는 인물 도감입니다.",
  alternates: {
    canonical: "/characters",
  },
};

export default function CharactersPage() {
  return (
    <main className="pb-5 sm:pb-6 lg:pb-8">
      <CharactersBanner />
      <div className="relative z-10 sm:-mt-12">
        <CharactersContent />
      </div>
    </main>
  );
}
