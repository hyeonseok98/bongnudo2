import type { Metadata } from "next";

import { getCurrentUser } from "@/features/auth/session";

import { ClipsContent } from "./_components/clips-content";

export const metadata: Metadata = {
  title: "클립",
  description: "봉누도2 참가자들의 치지직 클립을 날짜와 인물 기준으로 탐색해보세요.",
  alternates: {
    canonical: "/clips",
  },
};

export default async function ClipsPage() {
  const currentUser = await getCurrentUser();
  const canManageCollectedMedia = currentUser?.role === "admin" && currentUser.status === "active";

  return (
    <main className="space-y-6 py-5 sm:py-6 lg:py-8">
      <ClipsContent
        canAddTags={currentUser?.status === "active"}
        canManageCollectedMedia={canManageCollectedMedia}
      />
    </main>
  );
}
