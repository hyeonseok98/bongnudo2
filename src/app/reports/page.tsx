import { getCurrentUser } from "@/features/auth/session";

import { ReportPageContent } from "./_components/report-page-content";

export default async function ReportsPage() {
  const currentUser = await getCurrentUser();

  return <ReportPageContent isAuthenticated={currentUser !== null} />;
}
