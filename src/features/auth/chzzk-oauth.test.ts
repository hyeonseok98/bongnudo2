import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createOAuthState,
  getChzzkCallbackUrl,
  getLoginPageUrl,
  getSafeCookieReturnTo,
  getSafeReturnTo,
  hasValidOAuthState,
} from "./chzzk-oauth";

describe("Chzzk OAuth state", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("crypto 기반 state를 생성하고 timing-safe 검증함", () => {
    const state = createOAuthState();

    expect(state).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(hasValidOAuthState(state, state)).toBe(true);
    expect(hasValidOAuthState(state, state + "x")).toBe(false);
    expect(hasValidOAuthState(state, "x".repeat(state.length))).toBe(false);
  });

  it("SITE_URL을 기준으로 callback URL을 생성함", () => {
    vi.stubEnv("SITE_URL", "https://www.bongnurok.site");

    expect(getChzzkCallbackUrl()).toBe(
      "https://www.bongnurok.site/api/auth/chzzk/callback",
    );
  });

  it("동일 사이트 상대 경로만 로그인 복귀 경로로 허용함", () => {
    vi.stubEnv("SITE_URL", "https://www.bongnurok.site");

    expect(getSafeReturnTo("/live?job=police#current")).toBe(
      "/live?job=police#current",
    );
    expect(getSafeReturnTo("https://example.com/phishing")).toBe("/");
    expect(getSafeReturnTo("//example.com/phishing")).toBe("/");
    expect(getSafeReturnTo("/login")).toBe("/");
    expect(getSafeReturnTo("/api/auth/logout")).toBe("/");
  });

  it("검증된 복귀 경로와 오류 코드로 로그인 URL을 생성함", () => {
    vi.stubEnv("SITE_URL", "https://www.bongnurok.site");

    expect(
      getLoginPageUrl({
        error: "failed",
        returnTo: "/characters?view=grid",
      }).toString(),
    ).toBe(
      "https://www.bongnurok.site/login?returnTo=%2Fcharacters%3Fview%3Dgrid&error=failed",
    );
  });

  it("브라우저가 인코딩한 쿠키 복귀 경로를 한 번만 디코딩함", () => {
    vi.stubEnv("SITE_URL", "https://www.bongnurok.site");

    expect(getSafeCookieReturnTo("%2Flive%3Fquery%3D%252Ftest")).toBe(
      "/live?query=%2Ftest",
    );
    expect(getSafeCookieReturnTo("%2F%2Fexample.com%2Fphishing")).toBe("/");
  });
});
