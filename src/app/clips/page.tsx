import type { Metadata } from "next";

import { ClipsContent } from "./_components/clips-content";

export const metadata: Metadata = {
  title: "클립 | 봉누록",
  description: "봉누도2 참가자의 클립을 찾아보세요.",
  alternates: {
    canonical: "/clips",
  },
};

export default function ClipsPage() {
  return (
    <main className="space-y-6 py-5 sm:py-6 lg:py-8">
      <ClipsContent />
    </main>
  );
}
