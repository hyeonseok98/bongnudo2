import type { Metadata } from "next";

import { getCurrentKstDate } from "@/features/timeline/timeline-params";
import { getCurrentUser } from "@/features/auth/session";

import { TimelineContent } from "./_components/timeline-content";

export const metadata: Metadata = {
  title: "전체 타임라인 | 봉누도2",
  description:
    "봉누도에서 벌어지는 모든 순간과 사람들이 만들어가는 이야기를 확인해보세요.",
  alternates: { canonical: "/timeline" },
};

export default async function TimelinePage() {
  const currentUser = await getCurrentUser();

  return (
    <main className="py-5 sm:py-6 lg:py-8">
      <TimelineContent
        isAuthenticated={currentUser !== null}
        today={getCurrentKstDate()}
      />
    </main>
  );
}
