import type { Metadata } from "next";

import { DirectoryHero } from "@/components/layouts/directory-hero";

import { OrganizationsContent } from "./_components/organizations-content";

export const metadata: Metadata = {
  title: "조직 도감 | 봉누록",
  description: "봉누도2의 다양한 조직을 확인해보세요.",
  alternates: {
    canonical: "/organizations",
  },
};

export default function OrganizationsPage() {
  return (
    <main className="pb-5 sm:pb-6 lg:pb-8">
      <DirectoryHero
        darkSrc="/banner/city_dusk_dark.webp"
        emphasisText="하나의 도시."
        leadText="서로 다른 목적,"
        lightSrc="/banner/city_dusk_light.webp"
      />
      <div className="relative z-10 sm:-mt-12">
        <OrganizationsContent />
      </div>
    </main>
  );
}
