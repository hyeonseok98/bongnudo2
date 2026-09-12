import "server-only";

import { z } from "zod";

const CHZZK_AUTHORIZATION_URL = "https://chzzk.naver.com/account-interlock";
const CHZZK_TOKEN_URL = "https://openapi.chzzk.naver.com/auth/v1/token";
const CHZZK_CURRENT_USER_URL = "https://openapi.chzzk.naver.com/open/v1/users/me";

const chzzkTokenResponseSchema = z.object({
  code: z.number(),
  content: z.object({
    accessToken: z.string().min(1),
  }),
});

const chzzkCurrentUserResponseSchema = z.object({
  code: z.number(),
  content: z.object({
    channelId: z.string().min(1),
    channelName: z.string().min(1),
  }),
});

export interface ChzzkCurrentUser {
  channelId: string;
  channelName: string;
}

export function createChzzkAuthorizationUrl({
  redirectUri,
  state,
}: {
  redirectUri: string;
  state: string;
}): URL {
  const { clientId } = getChzzkCredentials();
  const url = new URL(CHZZK_AUTHORIZATION_URL);
  url.searchParams.set("clientId", clientId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);

  return url;
}

export async function exchangeChzzkAuthorizationCode({
  code,
  state,
}: {
  code: string;
  state: string;
}): Promise<string> {
  const { clientId, clientSecret } = getChzzkCredentials();
  const response = await fetch(CHZZK_TOKEN_URL, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grantType: "authorization_code",
      clientId,
      clientSecret,
      code,
      state,
    }),
  });

  if (!response.ok) {
    throw new Error("치지직 인증에 실패함.");
  }

  return chzzkTokenResponseSchema.parse(await response.json()).content
    .accessToken;
}

export async function getChzzkCurrentUser(
  accessToken: string,
): Promise<ChzzkCurrentUser> {
  const response = await fetch(CHZZK_CURRENT_USER_URL, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("치지직 사용자 정보를 불러오지 못함.");
  }

  const parsedResponse = chzzkCurrentUserResponseSchema.parse(
    await response.json(),
  );

  return parsedResponse.content;
}

function getChzzkCredentials(): {
  clientId: string;
  clientSecret: string;
} {
  const clientId = process.env.CHZZK_CLIENT_ID;
  const clientSecret = process.env.CHZZK_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("치지직 환경변수가 설정되지 않음.");
  }

  return { clientId, clientSecret };
}
