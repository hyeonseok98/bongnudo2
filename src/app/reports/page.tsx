import type { Metadata } from "next";

import { getCurrentUser } from "@/features/auth/session";

import { ReportPageContent } from "./_components/report-page-content";

export const metadata: Metadata = {
  title: "제보",
  robots: { index: false, follow: false },
};

export default async function ReportsPage() {
  const currentUser = await getCurrentUser();

  return <ReportPageContent isAuthenticated={currentUser !== null} />;
}
