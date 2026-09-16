import type { Metadata } from "next";

import { getCurrentUser } from "@/features/auth/session";

import { ArchiveEditor } from "../../_components/archive-editor";

export const metadata: Metadata = {
  title: "아카이브 편집 | 봉누록",
  robots: { index: false },
};

export default async function ArchiveEditPage({
  params,
}: {
  params: Promise<{ archiveId: string }>;
}) {
  const [{ archiveId }, user] = await Promise.all([params, getCurrentUser()]);

  return <ArchiveEditor archiveId={archiveId} isSignedIn={user !== null} />;
}
