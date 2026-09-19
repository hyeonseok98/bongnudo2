import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./_components/home-hero", () => ({
  HomeHero: () => <header data-home-section="hero" />,
}));
vi.mock("./_components/home-live", () => ({
  HomeLive: () => <section data-home-section="live" />,
}));
vi.mock("./_components/home-clips", () => ({
  HomeClips: () => <section data-home-section="clips" />,
}));
vi.mock("./_components/home-replays", () => ({
  HomeReplays: () => <section data-home-section="replays" />,
}));
vi.mock("./_components/home-archives", () => ({
  HomeArchives: () => <section data-home-section="archives" />,
}));

import HomePage from "./page";

describe("HomePage", () => {
  it("콘텐츠 탐색 섹션을 지정된 순서로 렌더링함", () => {
    const { container } = render(<HomePage />);
    const sectionOrder = Array.from(
      container.querySelectorAll<HTMLElement>("[data-home-section]"),
    ).map((element) => element.dataset.homeSection);

    expect(sectionOrder).toEqual([
      "hero",
      "clips",
      "replays",
      "archives",
      "live",
    ]);
  });
});
