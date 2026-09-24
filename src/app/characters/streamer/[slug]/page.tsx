import type { Metadata } from "next";

import { getStreamerMetadata } from "@/features/characters/character-metadata";

import { CharacterDetail } from "../../_components/character-detail";

export default async function StreamerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <main>
      <CharacterDetail identifier={slug} kind="streamer" />
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const streamer = await getStreamerMetadata(slug);

  if (!streamer) {
    return {
      title: "스트리머를 찾을 수 없음",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${streamer.streamer.name} 스트리머`,
    description: `${streamer.streamer.name} 스트리머의 봉누도2 활동과 RP 캐릭터 정보를 확인해보세요.`,
    alternates: { canonical: `/characters/streamer/${encodeURIComponent(slug)}` },
  };
}
