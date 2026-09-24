import type { Metadata } from "next";

import { getRpMetadata } from "@/features/characters/character-metadata";

import { CharacterDetail } from "../../_components/character-detail";

export default async function RpDetailPage({
  params,
}: {
  params: Promise<{ stableId: string }>;
}) {
  const { stableId } = await params;

  return (
    <main>
      <CharacterDetail identifier={stableId} kind="rp" />
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ stableId: string }>;
}): Promise<Metadata> {
  const { stableId } = await params;
  const character = await getRpMetadata(stableId);

  if (!character?.rp_name) {
    return {
      title: "RP 캐릭터를 찾을 수 없음",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${character.rp_name} RP 캐릭터`,
    description: `${character.rp_name}의 봉누도2 RP 활동과 인물 정보를 확인해보세요.`,
    alternates: { canonical: `/characters/rp/${encodeURIComponent(stableId)}` },
  };
}
