import type { Metadata } from "next";

import { HomeArchives } from "./_components/home-archives";
import { HomeClips } from "./_components/home-clips";
import { HomeHero } from "./_components/home-hero";
import { HomeLive } from "./_components/home-live";
import { HomeReplays } from "./_components/home-replays";

export const metadata: Metadata = {
  title: "봉누록",
  description: "각자의 이야기로 완성되는 봉누도2를 만나보세요.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <main className="pb-2">
      <HomeHero />
      <div className="space-y-12 py-8 sm:space-y-14 sm:py-10 lg:space-y-16 lg:py-12">
        <HomeClips />
        <HomeReplays />
        <HomeArchives />
        <HomeLive />
      </div>
    </main>
  );
}
