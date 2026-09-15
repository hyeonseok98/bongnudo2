"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { ReportDialog } from "./report-dialog";
import { ReportLoginDialog } from "./report-login-dialog";

export function ReportPageContent({ isAuthenticated }: { isAuthenticated: boolean }) {
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isAuthenticated) {
    return <ReportLoginDialog onClose={() => router.push("/")} />;
  }

  if (successMessage) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <section className="w-full max-w-md rounded-xl border border-default bg-surface-raised p-6 text-center shadow-sm">
          <h1 className="text-title-sm font-bold text-primary">
            제보가 접수되었습니다.
          </h1>
          <p className="mt-2 text-body-sm text-secondary">{successMessage}</p>
          <Button className="mt-5" onClick={() => router.push("/")}>
            홈으로 이동
          </Button>
        </section>
      </div>
    );
  }

  return (
    <ReportDialog
      onClose={() => router.push("/")}
      onSuccess={setSuccessMessage}
    />
  );
}
