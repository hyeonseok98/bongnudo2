"use client";

import { Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/utils/cn";

const AGREEMENTS = [
  { id: "terms", label: "이용약관에 동의합니다." },
  { id: "privacy", label: "개인정보 처리방침에 동의합니다." },
  { id: "age", label: "만 14세 이상입니다." },
] as const;

type AgreementId = (typeof AGREEMENTS)[number]["id"];
type AgreementState = Record<AgreementId, boolean>;

const INITIAL_AGREEMENTS: AgreementState = {
  terms: false,
  privacy: false,
  age: false,
};

export function LoginConsentForm({
  returnTo,
  errorMessage,
}: {
  returnTo: string;
  errorMessage?: string;
}) {
  const [agreements, setAgreements] = useState(INITIAL_AGREEMENTS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const allAgreed = AGREEMENTS.every(({ id }) => agreements[id]);

  useEffect(() => {
    function syncRestoredAgreements(): void {
      const form = formRef.current;

      if (!form) {
        return;
      }

      const formData = new FormData(form);
      setAgreements({
        terms: formData.get("terms") === "true",
        privacy: formData.get("privacy") === "true",
        age: formData.get("age") === "true",
      });
      setIsSubmitting(false);
    }

    window.addEventListener("pageshow", syncRestoredAgreements);
    const syncTimeout = window.setTimeout(syncRestoredAgreements);

    return () => {
      window.clearTimeout(syncTimeout);
      window.removeEventListener("pageshow", syncRestoredAgreements);
    };
  }, []);

  function toggleAll(): void {
    const nextChecked = !allAgreed;

    setAgreements({
      terms: nextChecked,
      privacy: nextChecked,
      age: nextChecked,
    });
  }

  function toggleAgreement(id: AgreementId): void {
    setAgreements((current) => ({
      ...current,
      [id]: !current[id],
    }));
  }

  return (
    <form
      ref={formRef}
      action="/api/auth/chzzk"
      method="post"
      onSubmit={() => setIsSubmitting(true)}
      className="space-y-5"
    >
      <input name="returnTo" type="hidden" value={returnTo} />

      <div className="rounded-xl border border-default bg-surface-inset/70 p-4 sm:p-5">
        <label className="flex cursor-pointer items-start gap-3 border-b border-default pb-4">
          <input
            checked={allAgreed}
            className="mt-0.5 size-5 shrink-0 cursor-pointer accent-brand"
            onChange={toggleAll}
            type="checkbox"
          />
          <span>
            <span className="block text-body font-semibold text-primary">
              모두 동의합니다.
            </span>
            <span className="mt-1 block text-caption text-secondary">
              로그인에 필요한 필수 항목을 한 번에 선택합니다.
            </span>
          </span>
        </label>

        <div className="pt-2">
          {AGREEMENTS.map(({ id, label }) => (
            <label
              className="flex cursor-pointer items-center gap-3 py-2.5 text-body-sm text-primary"
              key={id}
            >
              <input
                checked={agreements[id]}
                className="size-5 shrink-0 cursor-pointer accent-brand"
                name={id}
                onChange={() => toggleAgreement(id)}
                required
                type="checkbox"
                value="true"
              />
              <span>
                {label} <span className="text-status-danger">(필수)</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <button
        className={cn(
          buttonVariants(),
          "h-12 w-full border-chzzk bg-chzzk text-body font-semibold text-chzzk-foreground hover:opacity-90 focus-visible:border-chzzk",
        )}
        disabled={!allAgreed || isSubmitting}
        type="submit"
      >
        <span className="flex size-7 items-center justify-center rounded-md bg-chzzk-foreground text-chzzk">
          <ChzzkIcon />
        </span>
        {isSubmitting ? "로그인 중..." : "치지직으로 로그인"}
      </button>

      {errorMessage ? (
        <p className="text-center text-body-sm text-status-danger" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <p className="flex min-h-4 items-center justify-center gap-2 text-caption text-secondary">
        <Info aria-hidden="true" className="size-4 shrink-0" />
        <span className="leading-none">
          위 필수 항목에 모두 동의해야 로그인할 수 있습니다.
        </span>
      </p>
    </form>
  );
}

function ChzzkIcon() {
  return (
    <svg
      aria-hidden="true"
      className="!size-7"
      fill="currentColor"
      viewBox="0 0 1024 1024"
    >
      <path d="M437 194h210l-63 88h209L534 640h236v156H211l262-363H263z" />
    </svg>
  );
}
