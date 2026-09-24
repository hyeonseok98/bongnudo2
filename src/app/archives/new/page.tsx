import type { Metadata } from "next";

import { getCurrentUser } from "@/features/auth/session";

import { ArchiveCreateContent } from "../_components/archive-create-content";

export const metadata: Metadata = {
  title: "새 아카이브",
  robots: { index: false },
};

export default async function NewArchivePage() {
  const user = await getCurrentUser();

  return <ArchiveCreateContent isSignedIn={user !== null} />;
}
