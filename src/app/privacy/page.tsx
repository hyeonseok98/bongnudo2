import type { Metadata } from "next";

import { LegalDocument } from "../_components/legal-document";
import { privacyPolicy } from "../_content/privacy-policy";

export const metadata: Metadata = {
  title: "개인정보 처리방침",
  description: "봉누록 개인정보 처리방침입니다.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      announcedAt="2026년 9월 14일"
      content={privacyPolicy}
      effectiveAt="2026년 9월 14일"
      title="개인정보 처리방침"
    />
  );
}
