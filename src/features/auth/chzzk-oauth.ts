import "server-only";

import { randomBytes, timingSafeEqual } from "node:crypto";

export const OAUTH_STATE_COOKIE_NAME = "bongnurok_oauth_state";
export const OAUTH_RETURN_TO_COOKIE_NAME = "bongnurok_oauth_return_to";
export const OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;

export type LoginErrorCode = "consent" | "failed";

export function createOAuthState(): string {
  return randomBytes(32).toString("base64url");
}

export function hasValidOAuthState(
  receivedState: string,
  storedState: string,
): boolean {
  const receivedBuffer = Buffer.from(receivedState);
  const storedBuffer = Buffer.from(storedState);

  return receivedBuffer.length === storedBuffer.length
    && timingSafeEqual(receivedBuffer, storedBuffer);
}

export function getSiteUrl(): URL {
  const siteUrl = process.env.SITE_URL?.trim();

  if (!siteUrl) {
    throw new Error("사이트 URL 환경변수가 설정되지 않음.");
  }

  const parsedSiteUrl = new URL(siteUrl);

  if (
    parsedSiteUrl.protocol !== "http:"
    && parsedSiteUrl.protocol !== "https:"
  ) {
    throw new Error("사이트 URL 환경변수가 올바르지 않음.");
  }

  return parsedSiteUrl;
}

export function getChzzkCallbackUrl(): string {
  return new URL("/api/auth/chzzk/callback", getSiteUrl()).toString();
}

export function getSafeReturnTo(value: string | null | undefined): string {
  if (!value?.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  const siteUrl = getSiteUrl();

  try {
    const returnUrl = new URL(value, siteUrl);

    if (
      returnUrl.origin !== siteUrl.origin
      || returnUrl.pathname === "/login"
      || returnUrl.pathname.startsWith("/api/auth/")
    ) {
      return "/";
    }

    return `${returnUrl.pathname}${returnUrl.search}${returnUrl.hash}`;
  } catch {
    return "/";
  }
}

export function getSafeCookieReturnTo(
  value: string | null | undefined,
): string {
  if (!value) {
    return "/";
  }

  try {
    return getSafeReturnTo(decodeURIComponent(value));
  } catch {
    return "/";
  }
}

export function getLoginPageUrl({
  returnTo,
  error,
}: {
  returnTo?: string | null;
  error?: LoginErrorCode;
} = {}): URL {
  const loginUrl = new URL("/login", getSiteUrl());
  const safeReturnTo = getSafeReturnTo(returnTo);

  if (safeReturnTo !== "/") {
    loginUrl.searchParams.set("returnTo", safeReturnTo);
  }

  if (error) {
    loginUrl.searchParams.set("error", error);
  }

  return loginUrl;
}
