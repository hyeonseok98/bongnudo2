import type { Metadata } from "next";

import { HomeCharacters } from "./_components/home-characters";
import { HomeHero } from "./_components/home-hero";
import { HomeLive } from "./_components/home-live";
import { HomeOrganizations } from "./_components/home-organizations";

export const metadata: Metadata = {
  title: "봉누록",
  description: "각자의 이야기로 완성되는 봉누도2를 만나보세요.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <main>
      <HomeHero />
      <div className="space-y-10 py-8 sm:space-y-12 sm:py-10 lg:py-12">
        <HomeLive />
        <HomeCharacters />
        <HomeOrganizations />
      </div>
    </main>
  );
}
