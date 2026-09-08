import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { CharacterListItem } from "@/features/characters/character";

import { CharacterCard } from "./character-card";

const character: CharacterListItem = {
  id: "participant",
  streamerId: "streamer",
  slug: "streamer",
  streamerName: "스트리머",
  rpName: null,
  profileImageUrl: null,
  streamerAffiliations: [
    { id: "group", slug: "group", name: "그룹", type: "group", sortOrder: 1 },
    { id: "mcn", slug: "mcn", name: "MCN", type: "mcn", sortOrder: 1 },
  ],
  affiliations: [
    {
      id: "third",
      slug: "press",
      name: "언론",
      category: "public-service",
      role: "기자",
      isPrimary: false,
      displayOrder: 3,
      isLeader: false,
    },
    {
      id: "second",
      slug: "polxx",
      name: "경찰",
      category: "public-service",
      role: "순경",
      isPrimary: false,
      displayOrder: 2,
      isLeader: false,
    },
    {
      id: "first",
      slug: "ems",
      name: "EMS",
      category: "public-service",
      role: "병원장",
      isPrimary: true,
      displayOrder: 1,
      isLeader: true,
    },
  ],
};

describe("CharacterCard", () => {
  it("현재 RP 조직은 두 개와 +N만 표시하고 현실 소속은 MCN부터 표시함", () => {
    render(<CharacterCard character={character} />);

    expect(screen.getByText("EMS · 병원장")).toBeTruthy();
    expect(screen.getByText("경찰 · 순경")).toBeTruthy();
    expect(screen.queryByText("언론 · 기자")).toBeNull();
    expect(screen.getByText("+1")).toBeTruthy();

    const realityAffiliations = screen
      .getAllByText(/^(MCN|그룹)$/)
      .map((element) => element.textContent);

    expect(realityAffiliations).toEqual(["MCN", "그룹"]);
  });
});