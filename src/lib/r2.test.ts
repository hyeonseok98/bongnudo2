import { afterEach, describe, expect, it, vi } from "vitest";

import { getR2PublicUrl } from "./r2";

describe("getR2PublicUrl", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("R2 object key의 경로 구조를 유지하며 URL로 변환함", () => {
    vi.stubEnv("NEXT_PUBLIC_R2_PUBLIC_URL", "https://assets.example.com/");

    expect(getR2PublicUrl("/streamers/남봉/profile/남봉.webp")).toBe(
      "https://assets.example.com/streamers/%EB%82%A8%EB%B4%89/profile/%EB%82%A8%EB%B4%89.webp",
    );
  });

  it("빈 object key는 이미지 URL로 만들지 않음", () => {
    vi.stubEnv("NEXT_PUBLIC_R2_PUBLIC_URL", "https://assets.example.com");

    expect(getR2PublicUrl(null)).toBeNull();
    expect(getR2PublicUrl("   ")).toBeNull();
  });
});
