import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createChzzkAuthorizationUrl,
  exchangeChzzkAuthorizationCode,
  getChzzkCurrentUser,
} from "./chzzk";

describe("Chzzk OAuth API", () => {
  beforeEach(() => {
    vi.stubEnv("CHZZK_CLIENT_ID", "client-id");
    vi.stubEnv("CHZZK_CLIENT_SECRET", "client-secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("공식 로그인 URL에 clientId, redirectUri, state를 포함함", () => {
    const url = createChzzkAuthorizationUrl({
      redirectUri: "http://localhost:3000/api/auth/chzzk/callback",
      state: "oauth-state",
    });

    expect(url.origin + url.pathname).toBe(
      "https://chzzk.naver.com/account-interlock",
    );
    expect(url.searchParams.get("clientId")).toBe("client-id");
    expect(url.searchParams.get("redirectUri")).toBe(
      "http://localhost:3000/api/auth/chzzk/callback",
    );
    expect(url.searchParams.get("state")).toBe("oauth-state");
  });

  it("인증 코드를 공식 token endpoint에서 access token으로 교환함", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({
      code: 200,
      content: {
        accessToken: "access-token",
        refreshToken: "discarded-refresh-token",
        tokenType: "Bearer",
        expiresIn: "86400",
      },
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(exchangeChzzkAuthorizationCode({
      code: "authorization-code",
      state: "oauth-state",
    })).resolves.toBe("access-token");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://openapi.chzzk.naver.com/auth/v1/token",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          grantType: "authorization_code",
          clientId: "client-id",
          clientSecret: "client-secret",
          code: "authorization-code",
          state: "oauth-state",
        }),
      }),
    );
  });

  it("access token으로 공식 users/me 응답을 검증함", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({
      code: 200,
      content: {
        channelId: "channel-id",
        channelName: "채널 이름",
      },
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getChzzkCurrentUser("access-token")).resolves.toEqual({
      channelId: "channel-id",
      channelName: "채널 이름",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://openapi.chzzk.naver.com/open/v1/users/me",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });
});
