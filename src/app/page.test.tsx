import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./_components/home-hero", () => ({
  HomeHero: () => <header data-home-section="hero" />,
}));
vi.mock("./_components/home-live", () => ({
  HomeLive: () => <section data-home-section="live" />,
}));
vi.mock("./_components/home-characters", () => ({
  HomeCharacters: () => <section data-home-section="characters" />,
}));
vi.mock("./_components/home-organizations", () => ({
  HomeOrganizations: () => <section data-home-section="organizations" />,
}));

import HomePage from "./page";

describe("HomePage", () => {
  it("MVP 섹션을 지정된 순서로 렌더링함", () => {
    const { container } = render(<HomePage />);
    const sectionOrder = Array.from(
      container.querySelectorAll<HTMLElement>("[data-home-section]"),
    ).map((element) => element.dataset.homeSection);

    expect(sectionOrder).toEqual([
      "hero",
      "live",
      "characters",
      "organizations",
    ]);
    expect(container.textContent).not.toContain("다시보기");
    expect(container.textContent).not.toContain("클립");
  });
});
