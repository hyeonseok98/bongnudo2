import type { Metadata } from "next";

import { getCurrentUser } from "@/features/auth/session";

import { ReplaysContent } from "./_components/replays-content";

export const metadata: Metadata = {
  title: "다시보기",
  description: "봉누도2 다시보기를 참가자와 방송 일차 기준으로 탐색해보세요.",
  alternates: { canonical: "/replays" },
};

export default async function ReplaysPage() {
  const currentUser = await getCurrentUser();
  const canManageCollectedMedia = currentUser?.role === "admin" && currentUser.status === "active";

  return (
    <main className="space-y-6 py-5 sm:py-6 lg:py-8">
      <ReplaysContent canManageCollectedMedia={canManageCollectedMedia} />
    </main>
  );
}
