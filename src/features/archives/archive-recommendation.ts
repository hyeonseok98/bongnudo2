import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { cookies } from "next/headers";

import { getCurrentUser } from "@/features/auth/session";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

import { ArchiveRequestError } from "./archive-error";
import type { ArchiveRecommendationResult } from "./archive-recommendation-client";

export type { ArchiveRecommendationResult } from "./archive-recommendation-client";

export const ARCHIVE_ANONYMOUS_VOTER_COOKIE_NAME = "bongnurok_archive_voter";

const ARCHIVE_ANONYMOUS_VOTER_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

export interface ArchiveRecommendationState extends ArchiveRecommendationResult {
  archiveId: string;
}

export interface ArchiveRecommendationViewer {
  anonymousVoterHash: string | null;
  userId: string | null;
}

interface PreparedArchiveRecommendationViewer {
  anonymousTokenToSet: string | null;
  viewer: ArchiveRecommendationViewer;
}

export async function getArchiveRecommendationViewer(): Promise<ArchiveRecommendationViewer> {
  const [user, cookieStore] = await Promise.all([getCurrentUser(), cookies()]);
  const anonymousToken = cookieStore.get(ARCHIVE_ANONYMOUS_VOTER_COOKIE_NAME)?.value ?? null;

  return {
    anonymousVoterHash: anonymousToken ? hashAnonymousVoterToken(anonymousToken) : null,
    userId: user?.id ?? null,
  };
}

export async function prepareArchiveRecommendationViewer(): Promise<PreparedArchiveRecommendationViewer> {
  const [user, cookieStore] = await Promise.all([getCurrentUser(), cookies()]);
  const storedAnonymousToken = cookieStore.get(ARCHIVE_ANONYMOUS_VOTER_COOKIE_NAME)?.value ?? null;
  const anonymousToken = storedAnonymousToken ?? (user === null ? randomBytes(32).toString("base64url") : null);

  return {
    anonymousTokenToSet: storedAnonymousToken === null ? anonymousToken : null,
    viewer: {
      anonymousVoterHash: anonymousToken ? hashAnonymousVoterToken(anonymousToken) : null,
      userId: user?.id ?? null,
    },
  };
}

export async function setArchiveAnonymousVoterCookie(token: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(ARCHIVE_ANONYMOUS_VOTER_COOKIE_NAME, token, {
    httpOnly: true,
    maxAge: ARCHIVE_ANONYMOUS_VOTER_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function getArchiveRecommendationStates(
  archiveIds: string[],
  viewer: ArchiveRecommendationViewer,
): Promise<Map<string, ArchiveRecommendationState>> {
  const uniqueArchiveIds = Array.from(new Set(archiveIds));

  if (uniqueArchiveIds.length === 0) {
    return new Map();
  }

  const supabase = getSupabaseAdminClient();
  const [archivesResult, userRecommendedIds, anonymousRecommendedIds] = await Promise.all([
    supabase
      .from("archives")
      .select("id, recommendation_count")
      .in("id", uniqueArchiveIds),
    getUserRecommendedArchiveIds(uniqueArchiveIds, viewer.userId),
    getAnonymousRecommendedArchiveIds(uniqueArchiveIds, viewer.anonymousVoterHash),
  ]);

  if (archivesResult.error) {
    throw new ArchiveRequestError("아카이브 추천 정보를 불러오지 못했습니다.", 500, {
      cause: archivesResult.error,
    });
  }

  const recommendedIds = new Set([...userRecommendedIds, ...anonymousRecommendedIds]);

  return new Map(archivesResult.data.map((archive) => [archive.id, {
    archiveId: archive.id,
    recommendationCount: archive.recommendation_count,
    recommended: recommendedIds.has(archive.id),
  }]));
}

export async function toggleArchiveRecommendation(
  archiveId: string,
  viewer: ArchiveRecommendationViewer,
): Promise<ArchiveRecommendationResult> {
  const supabase = getSupabaseAdminClient();
  const result = await supabase.rpc("toggle_archive_recommendation", {
    p_archive_id: archiveId,
    p_anonymous_voter_hash: viewer.anonymousVoterHash ?? undefined,
    p_user_id: viewer.userId ?? undefined,
  });

  if (result.error || result.data.length !== 1) {
    const isForbidden = result.error?.message.includes("archive_recommendation_forbidden") ?? false;

    throw new ArchiveRequestError(
      isForbidden ? "추천할 수 없는 아카이브입니다." : "추천 처리에 실패했습니다.",
      isForbidden ? 403 : 500,
      { cause: result.error ?? undefined },
    );
  }

  return {
    recommendationCount: result.data[0].recommendation_count,
    recommended: result.data[0].recommended,
  };
}

async function getUserRecommendedArchiveIds(
  archiveIds: string[],
  userId: string | null,
): Promise<string[]> {
  if (!userId) return [];

  const result = await getSupabaseAdminClient()
    .from("archive_recommendations")
    .select("archive_id")
    .eq("user_id", userId)
    .in("archive_id", archiveIds);

  if (result.error) {
    throw new ArchiveRequestError("아카이브 추천 정보를 불러오지 못했습니다.", 500, {
      cause: result.error,
    });
  }

  return result.data.map((recommendation) => recommendation.archive_id);
}

async function getAnonymousRecommendedArchiveIds(
  archiveIds: string[],
  anonymousVoterHash: string | null,
): Promise<string[]> {
  if (!anonymousVoterHash) return [];

  const result = await getSupabaseAdminClient()
    .from("archive_recommendations")
    .select("archive_id")
    .eq("anonymous_voter_hash", anonymousVoterHash)
    .in("archive_id", archiveIds);

  if (result.error) {
    throw new ArchiveRequestError("아카이브 추천 정보를 불러오지 못했습니다.", 500, {
      cause: result.error,
    });
  }

  return result.data.map((recommendation) => recommendation.archive_id);
}

function hashAnonymousVoterToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
