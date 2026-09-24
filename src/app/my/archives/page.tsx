import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/session";

import { MyArchivesContent } from "./_components/my-archives-content";

export const metadata: Metadata = {
  title: "내 아카이브",
  robots: { index: false },
};

export default async function MyArchivesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?returnTo=%2Fmy%2Farchives");
  }

  return (
    <main className="py-5 sm:py-6 lg:py-8">
      <MyArchivesContent />
    </main>
  );
}
