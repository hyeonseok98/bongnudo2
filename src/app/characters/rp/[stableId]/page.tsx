import type { Metadata } from "next";

import { CharacterDetail } from "../../_components/character-detail";

export const metadata: Metadata = {
  title: "RP 캐릭터 상세 | 봉누록",
};

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
