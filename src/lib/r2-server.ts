import "server-only";

import { randomUUID } from "node:crypto";

import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import {
  MAX_REPORT_IMAGE_BYTES,
  REPORT_IMAGE_MIME_TYPE,
} from "@/features/reports/report-image";
import { ReportRequestError } from "@/features/reports/report-validation";

const REPORT_UPLOAD_EXPIRES_IN_SECONDS = 5 * 60;
const REPORT_UPLOAD_PREFIX = "timeline/tmp";
const REPORT_UPLOAD_METADATA_KEY = "uploader-id";

interface R2Configuration {
  bucketName: string;
  client: S3Client;
}

export interface ReportUploadConfigurationDiagnostics {
  configured: boolean;
  hasCustomEndpoint: boolean;
  isEndpointValid: boolean;
  missingVariables: string[];
}

export interface PreparedReportUpload {
  objectKey: string;
  uploadUrl: string;
  requiredHeaders: Record<string, string>;
  expiresInSeconds: number;
}

export interface VerifiedReportImage {
  objectKey: string;
  mimeType: typeof REPORT_IMAGE_MIME_TYPE;
  byteSize: number;
}

export async function prepareReportImageUpload(
  userId: string,
): Promise<PreparedReportUpload> {
  const { bucketName, client } = getR2Configuration();
  const objectKey = `${REPORT_UPLOAD_PREFIX}/${userId}/${randomUUID()}.webp`;
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    ContentType: REPORT_IMAGE_MIME_TYPE,
    Metadata: {
      [REPORT_UPLOAD_METADATA_KEY]: userId,
    },
  });
  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: REPORT_UPLOAD_EXPIRES_IN_SECONDS,
    signableHeaders: new Set(["content-type"]),
    unhoistableHeaders: new Set([
      `x-amz-meta-${REPORT_UPLOAD_METADATA_KEY}`,
    ]),
  });

  return {
    objectKey,
    uploadUrl,
    requiredHeaders: {
      "Content-Type": REPORT_IMAGE_MIME_TYPE,
      [`x-amz-meta-${REPORT_UPLOAD_METADATA_KEY}`]: userId,
    },
    expiresInSeconds: REPORT_UPLOAD_EXPIRES_IN_SECONDS,
  };
}

export async function verifyReportImageObject(
  objectKey: string,
  userId: string,
): Promise<VerifiedReportImage> {
  const expectedPrefix = `${REPORT_UPLOAD_PREFIX}/${userId}/`;

  if (!objectKey.startsWith(expectedPrefix)) {
    throw new ReportRequestError("첨부 이미지를 확인해주세요.");
  }

  const { bucketName, client } = getR2Configuration();
  let result;

  try {
    result = await client.send(
      new HeadObjectCommand({ Bucket: bucketName, Key: objectKey }),
    );
  } catch (error) {
    throw new ReportRequestError("첨부 이미지를 확인해주세요.", 400, {
      cause: error,
    });
  }

  const byteSize = result.ContentLength;

  if (
    result.ContentType !== REPORT_IMAGE_MIME_TYPE ||
    result.Metadata?.[REPORT_UPLOAD_METADATA_KEY] !== userId ||
    byteSize === undefined ||
    byteSize <= 0 ||
    byteSize > MAX_REPORT_IMAGE_BYTES
  ) {
    throw new ReportRequestError("첨부 이미지를 확인해주세요.");
  }

  return {
    objectKey,
    mimeType: REPORT_IMAGE_MIME_TYPE,
    byteSize,
  };
}

function getR2Configuration(): R2Configuration {
  const accountId = readEnvironmentVariable("R2_ACCOUNT_ID");
  const accessKeyId = readEnvironmentVariable("R2_ACCESS_KEY_ID");
  const secretAccessKey = readEnvironmentVariable("R2_SECRET_ACCESS_KEY");
  const bucketName = readEnvironmentVariable("R2_BUCKET_NAME");
  const endpoint = readEnvironmentVariable("R2_ENDPOINT");

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error("R2 환경변수가 설정되지 않음.");
  }

  if (endpoint && !isValidHttpsUrl(endpoint)) {
    throw new Error("R2 endpoint 설정이 올바르지 않음.");
  }

  return {
    bucketName,
    client: new S3Client({
      region: "auto",
      endpoint: endpoint || `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
      requestChecksumCalculation: "WHEN_REQUIRED",
    }),
  };
}

export function getReportUploadConfigurationDiagnostics(): ReportUploadConfigurationDiagnostics {
  const requiredVariables = [
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_NAME",
  ];
  const missingVariables = requiredVariables.filter(
    (name) => !readEnvironmentVariable(name),
  );
  const endpoint = readEnvironmentVariable("R2_ENDPOINT");

  return {
    configured: missingVariables.length === 0,
    hasCustomEndpoint: Boolean(endpoint),
    isEndpointValid: endpoint ? isValidHttpsUrl(endpoint) : true,
    missingVariables,
  };
}

function readEnvironmentVariable(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function isValidHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
