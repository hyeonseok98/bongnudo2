import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";

import {
  getSafeReturnTo,
  type LoginErrorCode,
} from "@/features/auth/chzzk-oauth";
import { getCurrentUser } from "@/features/auth/session";

import { LoginConsentForm } from "./_components/login-consent-form";

export const metadata: Metadata = {
  title: "로그인 | 봉누도2",
  description: "치지직 계정으로 봉누도2에 로그인합니다.",
  robots: { index: false, follow: false },
};

interface LoginPageProps {
  searchParams: Promise<{
    error?: string | string[];
    returnTo?: string | string[];
  }>;
}

const ERROR_MESSAGES: Partial<Record<LoginErrorCode, string>> = {
  consent: "필수 항목에 모두 동의해 주세요.",
  failed: "치지직 로그인에 실패했습니다. 다시 시도해 주세요.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const returnTo = getSafeReturnTo(getSingleParam(params.returnTo));
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect(returnTo);
  }

  const error = getSingleParam(params.error);
  const errorMessage = isLoginErrorCode(error)
    ? ERROR_MESSAGES[error]
    : undefined;

  return (
    <main
      data-login-page
      className="relative isolate flex min-h-full items-center justify-center overflow-hidden px-4 py-8 md:px-6 lg:px-8"
    >
      <Image
        alt=""
        className="-z-20 object-cover opacity-50"
        fill
        priority
        sizes="(min-width: 768px) calc(100vw - 14rem), 100vw"
        src="/banner/city_dark.webp"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-background/75" />

      <section className="w-full max-w-lg rounded-2xl border border-brand/50 bg-surface-raised/95 p-5 shadow-sm backdrop-blur-sm sm:p-8">
        <div className="mb-6 text-center">
          <p className="text-caption font-semibold text-brand-text">BONGNUDO2</p>
          <h1 className="mt-2 text-title font-bold text-primary">로그인</h1>
          <p className="mt-2 text-body-sm text-secondary">
            치지직 계정으로 안전하고 간편하게 시작해 보세요.
          </p>
        </div>

        <LoginConsentForm
          errorMessage={errorMessage}
          returnTo={returnTo}
        />
      </section>
    </main>
  );
}

function getSingleParam(value: string | string[] | undefined): string | null {
  return typeof value === "string" ? value : null;
}

function isLoginErrorCode(value: string | null): value is LoginErrorCode {
  return value === "consent" || value === "failed";
}
