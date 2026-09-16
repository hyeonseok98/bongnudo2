import type { Metadata } from "next";

import { ArchiveDetailContent } from "../_components/archive-detail-content";

export const metadata: Metadata = {
  title: "아카이브 | 봉누록",
};

export default async function ArchiveDetailPage({
  params,
}: {
  params: Promise<{ archiveId: string }>;
}) {
  const { archiveId } = await params;

  return <ArchiveDetailContent archiveId={archiveId} />;
}
