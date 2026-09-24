import type { Metadata } from "next";

import { LegalDocument } from "../_components/legal-document";
import { termsOfService } from "../_content/terms-of-service";

export const metadata: Metadata = {
  title: "이용약관",
  description: "봉누록 이용약관입니다.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalDocument
      announcedAt="2026년 9월 14일"
      content={termsOfService}
      effectiveAt="2026년 9월 14일"
      title="이용약관"
    />
  );
}
