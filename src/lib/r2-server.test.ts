import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getReportUploadConfigurationDiagnostics,
  prepareReportImageUpload,
} from "./r2-server";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getReportUploadConfigurationDiagnostics", () => {
  it("배포 환경값을 감싼 따옴표를 제거해 R2 설정을 판정함", () => {
    vi.stubEnv("R2_ACCOUNT_ID", '"account-id"');
    vi.stubEnv("R2_ACCESS_KEY_ID", '"access-key"');
    vi.stubEnv("R2_SECRET_ACCESS_KEY", '"secret-key"');
    vi.stubEnv("R2_BUCKET_NAME", '"bucket"');
    vi.stubEnv(
      "R2_ENDPOINT",
      '"https://account-id.r2.cloudflarestorage.com"',
    );

    expect(getReportUploadConfigurationDiagnostics()).toEqual({
      configured: true,
      hasCustomEndpoint: true,
      isEndpointValid: true,
      missingVariables: [],
    });
  });

  it("선택형 endpoint가 잘못되어도 계정 기본 endpoint로 업로드를 준비함", async () => {
    vi.stubEnv("R2_ACCOUNT_ID", '"account-id"');
    vi.stubEnv("R2_ACCESS_KEY_ID", '"access-key"');
    vi.stubEnv("R2_SECRET_ACCESS_KEY", '"secret-key"');
    vi.stubEnv("R2_BUCKET_NAME", '"bucket"');
    vi.stubEnv("R2_ENDPOINT", '"not-a-url"');

    const upload = await prepareReportImageUpload("user-id");

    expect(upload.uploadUrl).toMatch(
      /^https:\/\/bucket\.account-id\.r2\.cloudflarestorage\.com\//,
    );
  });
});
