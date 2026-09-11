import type { Metadata } from "next";

import { CharacterDetail } from "../../_components/character-detail";

export const metadata: Metadata = {
  title: "스트리머 상세 | 봉누도2",
};

export default async function StreamerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <main className="py-1 sm:py-2">
      <CharacterDetail identifier={slug} kind="streamer" />
    </main>
  );
}
