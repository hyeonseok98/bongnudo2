import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HomeHero } from "./home-hero";

describe("HomeHero", () => {
  it("공식 로고와 두 설명회 링크를 제공함", () => {
    render(<HomeHero />);

    expect(screen.getByAltText("BONGNUDO2")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "인게임 설명회 →" })
        .getAttribute("href"),
    ).toBe("https://chzzk.naver.com/video/15146208");
    expect(
      screen
        .getByRole("link", { name: "ppt 설명회" })
        .getAttribute("href"),
    ).toBe("https://chzzk.naver.com/video/14675572");
  });
});
