import type { Metadata } from "next";

import { getCurrentUser } from "@/features/auth/session";

import { ArchivesContent } from "./_components/archives-content";

export const metadata: Metadata = {
  title: "아카이브",
  description: "봉누도2의 인물·사건·장면을 정리한 공개 아카이브를 찾아보세요.",
  alternates: {
    canonical: "/archives",
  },
};

export default async function ArchivesPage() {
  const user = await getCurrentUser();

  return (
    <main className="space-y-6 py-5 sm:py-6 lg:py-8">
      <ArchivesContent isSignedIn={user !== null} />
    </main>
  );
}
