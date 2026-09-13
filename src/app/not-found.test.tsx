import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import NotFound from "./not-found";

describe("NotFound", () => {
  it("404 안내와 이동 링크를 표시함", () => {
    render(<NotFound />);

    expect(screen.getByRole("heading", { name: "찾을 수 없는 페이지입니다." })).toBeTruthy();
    expect(screen.getByRole("link", { name: "홈으로" }).getAttribute("href")).toBe("/");
    expect(
      screen.getByRole("link", { name: "인물 도감으로" }).getAttribute("href"),
    ).toBe("/characters");
  });
});
