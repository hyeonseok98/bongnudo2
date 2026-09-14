import type { Metadata } from "next";

import { OrganizationDetail } from "../_components/organization-detail";

export const metadata: Metadata = {
  title: "조직 상세 | 봉누록",
};

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <main>
      <OrganizationDetail slug={slug} />
    </main>
  );
}
