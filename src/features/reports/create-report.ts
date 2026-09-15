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
}

interface ReportWritePayload {
  categoryId: string;
  content: string;
  images: Json[];
  reportId: string;
  reporterUserId: string;
  reportType: ValidatedReportRequest["reportType"];
  title: string;
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
    timelineEventId: null,
    reporterUserId: payload.reporterUserId,
    seasonId: null,
    reportType: payload.reportType,
    categoryId: payload.categoryId,
    title: payload.title,
    content: payload.content,
    occurredAt: null,
    participantIds: [],
    tagIds: [],
    images: payload.images,
    clipUrls: [],
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

  return { reportId: created.created_report_id };
}

async function prepareReportWritePayload(
  user: AuthenticatedUser,
  request: ValidatedReportRequest,
): Promise<ReportWritePayload> {
  const [images] = await Promise.all([
    verifyReportImages(request.imageObjectKeys, user.id),
    assertValidCategory(request.categoryId, request.reportType),
  ]);

  return {
    reportId: randomUUID(),
    reporterUserId: user.id,
    reportType: request.reportType,
    categoryId: request.categoryId,
    title: request.title,
    content: request.content,
    images,
  };
}

async function assertValidCategory(
  categoryId: string,
  reportType: "bug" | "idea",
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
