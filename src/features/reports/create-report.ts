import "server-only";

import { randomUUID } from "node:crypto";

import type { Json } from "@/lib/supabase/database.types";
import { verifyReportImageObject } from "@/lib/r2-server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

import type { AuthenticatedUser } from "../auth/session";
import {
  ReportRequestError,
  validateReportRequest,
  type ValidatedReportRequest,
} from "./report-validation";

interface CreatedReport {
  reportId: string;
  timelineEventId: string | null;
}

interface ReportWritePayload {
  reportId: string;
  timelineEventId: string | null;
  reporterUserId: string;
  seasonId: number | null;
  reportType: ValidatedReportRequest["reportType"];
  categoryId: string | null;
  title: string;
  content: string;
  occurredAt: string | null;
  participantIds: string[];
  tagIds: string[];
  images: Json[];
  clipUrls: string[];
}

export async function createReport(
  user: AuthenticatedUser,
  rawRequest: unknown,
): Promise<CreatedReport> {
  const request = validateReportRequest(rawRequest);
  const payload = await prepareReportWritePayload(user, request);
  const supabase = getSupabaseAdminClient();
  const rpcPayload: Json = {
    reportId: payload.reportId,
    timelineEventId: payload.timelineEventId,
    reporterUserId: payload.reporterUserId,
    seasonId: payload.seasonId,
    reportType: payload.reportType,
    categoryId: payload.categoryId,
    title: payload.title,
    content: payload.content,
    occurredAt: payload.occurredAt,
    participantIds: payload.participantIds,
    tagIds: payload.tagIds,
    images: payload.images,
    clipUrls: payload.clipUrls,
  };
  const result = await supabase.rpc("create_report", {
    p_payload: rpcPayload,
  });

  if (result.error) {
    throw new ReportRequestError("제보를 저장하지 못했습니다.", 500, {
      cause: result.error,
    });
  }

  const created = result.data[0];

  if (!created) {
    throw new ReportRequestError("제보를 저장하지 못했습니다.", 500);
  }

  return {
    reportId: created.created_report_id,
    timelineEventId: created.created_timeline_event_id,
  };
}

async function prepareReportWritePayload(
  user: AuthenticatedUser,
  request: ValidatedReportRequest,
): Promise<ReportWritePayload> {
  const reportId = randomUUID();

  if (request.reportType === "timeline") {
    const seasonId = await getActiveSeasonId();
    const [images] = await Promise.all([
      verifyReportImages(request.imageObjectKeys, user.id),
      assertValidCategory(request.categoryId, request.reportType),
      assertValidParticipants(request.participantIds, seasonId),
      assertValidTags(request.tagIds),
    ]);

    return {
      reportId,
      timelineEventId: randomUUID(),
      reporterUserId: user.id,
      seasonId,
      reportType: request.reportType,
      categoryId: request.categoryId,
      title: request.title,
      content: request.content,
      occurredAt: request.occurredAt,
      participantIds: request.participantIds,
      tagIds: request.tagIds,
      images,
      clipUrls: request.clipUrls,
    };
  }

  if (request.reportType === "correction") {
    const seasonId = await getTargetTimelineSeasonId(request.timelineEventId);

    return {
      reportId,
      timelineEventId: request.timelineEventId,
      reporterUserId: user.id,
      seasonId,
      reportType: request.reportType,
      categoryId: null,
      title: request.title,
      content: request.content,
      occurredAt: null,
      participantIds: [],
      tagIds: [],
      images: [],
      clipUrls: [],
    };
  }

  const [images] = await Promise.all([
    verifyReportImages(request.imageObjectKeys, user.id),
    assertValidCategory(request.categoryId, request.reportType),
  ]);

  return {
    reportId,
    timelineEventId: null,
    reporterUserId: user.id,
    seasonId: null,
    reportType: request.reportType,
    categoryId: request.categoryId,
    title: request.title,
    content: request.content,
    occurredAt: null,
    participantIds: [],
    tagIds: [],
    images,
    clipUrls: [],
  };
}

async function getActiveSeasonId(): Promise<number> {
  const supabase = getSupabaseAdminClient();
  const result = await supabase
    .from("seasons")
    .select("id")
    .eq("is_active", true)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (result.error || !result.data) {
    throw new ReportRequestError("현재 시즌을 확인하지 못했습니다.", 500, {
      cause: result.error ?? undefined,
    });
  }

  return result.data.id;
}

async function getTargetTimelineSeasonId(eventId: string): Promise<number> {
  const supabase = getSupabaseAdminClient();
  const result = await supabase
    .from("timeline_events")
    .select("season_id")
    .eq("id", eventId)
    .eq("publication_status", "published")
    .maybeSingle();

  if (result.error) {
    throw new ReportRequestError("타임라인을 확인하지 못했습니다.", 500, {
      cause: result.error,
    });
  }

  if (!result.data) {
    throw new ReportRequestError("수정할 타임라인을 찾지 못했습니다.");
  }

  return result.data.season_id;
}

async function assertValidCategory(
  categoryId: string,
  reportType: "timeline" | "bug" | "idea",
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const result = await supabase
    .from("report_categories")
    .select("id")
    .eq("id", categoryId)
    .eq("report_type", reportType)
    .eq("is_active", true)
    .maybeSingle();

  if (result.error) {
    throw new ReportRequestError("카테고리를 확인하지 못했습니다.", 500, {
      cause: result.error,
    });
  }

  if (!result.data) {
    throw new ReportRequestError("올바른 카테고리를 선택해주세요.");
  }
}

async function assertValidParticipants(
  participantIds: string[],
  seasonId: number,
): Promise<void> {
  if (participantIds.length === 0) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  const result = await supabase
    .from("season_participants")
    .select("id")
    .eq("season_id", seasonId)
    .in("id", participantIds);

  if (result.error) {
    throw new ReportRequestError("인물 정보를 확인하지 못했습니다.", 500, {
      cause: result.error,
    });
  }

  if (result.data.length !== participantIds.length) {
    throw new ReportRequestError("올바른 인물을 선택해주세요.");
  }
}

async function assertValidTags(tagIds: string[]): Promise<void> {
  if (tagIds.length === 0) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  const result = await supabase
    .from("timeline_tags")
    .select("id")
    .eq("is_active", true)
    .in("id", tagIds);

  if (result.error) {
    throw new ReportRequestError("태그를 확인하지 못했습니다.", 500, {
      cause: result.error,
    });
  }

  if (result.data.length !== tagIds.length) {
    throw new ReportRequestError("올바른 태그를 선택해주세요.");
  }
}

async function verifyReportImages(
  objectKeys: string[],
  userId: string,
): Promise<Json[]> {
  const images = await Promise.all(
    objectKeys.map((objectKey) => verifyReportImageObject(objectKey, userId)),
  );

  return images.map((image) => ({
    objectKey: image.objectKey,
    mimeType: image.mimeType,
    byteSize: image.byteSize,
  }));
}
