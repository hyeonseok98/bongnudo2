import type { Metadata } from "next";

import {
  getArchiveDescription,
  getPublicArchiveMetadata,
} from "@/features/archives/archive-metadata";

import { ArchiveDetailContent } from "../_components/archive-detail-content";

export default async function ArchiveDetailPage({
  params,
}: {
  params: Promise<{ archiveId: string }>;
}) {
  const { archiveId } = await params;

  return <ArchiveDetailContent archiveId={archiveId} />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ archiveId: string }>;
}): Promise<Metadata> {
  const { archiveId } = await params;
  const archive = await getPublicArchiveMetadata(archiveId);

  if (!archive) {
    return {
      title: "아카이브",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: archive.title,
    description: getArchiveDescription(archive.description),
    alternates: { canonical: `/archives/${encodeURIComponent(archive.id)}` },
  };
}
