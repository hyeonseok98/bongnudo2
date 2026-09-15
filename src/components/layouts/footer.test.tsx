import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  usePathname: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: mocks.usePathname,
}));

import { Footer } from "./footer";

describe("Footer", () => {
  beforeEach(() => vi.clearAllMocks());

  it("일반 페이지에는 정책 문서 링크를 표시함", () => {
    mocks.usePathname.mockReturnValue("/live");

    render(<Footer />);

    expect(
      screen
        .getByRole("link", { name: "개인정보 처리방침" })
        .getAttribute("href"),
    ).toBe("/privacy");
    expect(
      screen.getByRole("link", { name: "이용약관" }).getAttribute("href"),
    ).toBe("/terms");
  });

  it.each(["/characters/streamer/강지", "/characters/rp/participant-id"])(
    "인물 상세 경로 %s에서는 표시하지 않음",
    (pathname) => {
      mocks.usePathname.mockReturnValue(pathname);

      const { container } = render(<Footer />);

      expect(container.innerHTML).toBe("");
    },
  );
});
