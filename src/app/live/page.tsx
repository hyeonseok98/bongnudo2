import type { Metadata } from "next";

import { LiveContent } from "./_components/live-content";

export const metadata: Metadata = {
  title: "실시간 현황 | 봉누록",
  description: "현재 방송 중인 봉누도2 참가자를 확인해보세요.",
  alternates: {
    canonical: "/live",
  },
};

export default function LivePage() {
  return (
    <main className="space-y-6 py-5 sm:py-6 lg:py-8">
      <LiveContent />
    </main>
  );
}
