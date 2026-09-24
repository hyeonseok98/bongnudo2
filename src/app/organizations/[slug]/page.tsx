import type { Metadata } from "next";

import { getOrganizationMetadata } from "@/features/organizations/organization-metadata";

import { OrganizationDetail } from "../_components/organization-detail";

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const organization = await getOrganizationMetadata(slug);

  if (!organization) {
    return {
      title: "조직을 찾을 수 없음",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${organization.name} 조직`,
    description: `봉누도2의 ${organization.name} 소속과 구성원을 확인해보세요.`,
    alternates: { canonical: `/organizations/${encodeURIComponent(slug)}` },
  };
}
