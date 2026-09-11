import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { CharacterListItem } from "@/features/characters/character";

import { buildCharacterDirectoryItems } from "../_utils/character-directory";
import { CharacterCard } from "./character-card";

const character: CharacterListItem = {
  id: "participant",
  streamerId: "streamer",
  chzzkChannelId: "channel",
  slug: "streamer",
  streamerName: "스트리머",
  rpName: null,
  profileImageUrl: null,
  channelUrl: null,
  streamerAffiliations: [
    { id: "group", slug: "group", name: "그룹", type: "group", sortOrder: 1 },
    { id: "mcn", slug: "mcn", name: "MCN", type: "mcn", sortOrder: 1 },
  ],
  affiliations: [
    {
      id: "third",
      slug: "media",
      name: "언론",
      category: "public-service",
      role: "기자",
      isPrimary: false,
      displayOrder: 3,
      isLeader: false,
    },
    {
      id: "second",
      slug: "police",
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
  roleHistories: [],
};

const item = buildCharacterDirectoryItems([character], "streamer")[0]!;

describe("CharacterCard", () => {
  it("현재 RP 조직은 두 개와 +N만 표시하고 현실 소속은 MCN부터 표시함", () => {
    render(<CharacterCard item={item} />);

    expect(screen.getByText("EMS")).toBeTruthy();
    expect(screen.getByText("병원장 ✦").className).not.toContain(
      "font-semibold",
    );
    expect(screen.getByText("병원장 ✦").className).not.toContain(
      "shadow-",
    );
    expect(screen.getByText("병원장 ✦").className).toContain(
      "bg-job-ems/55",
    );
    expect(screen.getByText("경찰")).toBeTruthy();
    expect(screen.getByText("순경").className).toContain(
      "text-job-police-foreground",
    );
    expect(screen.queryByText("언론")).toBeNull();
    expect(screen.getByText("+1")).toBeTruthy();

    const realityAffiliations = screen
      .getAllByText(/^(MCN|그룹)$/)
      .map((element) => element.textContent);

    expect(realityAffiliations).toEqual(["MCN", "그룹"]);
  });

  it("프로필 이미지 로드 실패 시 프로필 placeholder로 복구함", () => {
    const { container } = render(
      <CharacterCard
        item={{
          ...item,
          profileImageUrl: "https://assets.example.com/profile.webp",
        }}
      />,
    );

    const image = screen.getByRole("img", { name: "스트리머 프로필" });

    expect(
      container.querySelector("[data-slot='character-avatar-loading']"),
    ).not.toBeNull();
    expect(container.querySelector("svg[aria-hidden='true']")).toBeNull();

    fireEvent.error(image);

    expect(
      screen.queryByRole("img", { name: "스트리머 프로필" }),
    ).toBeNull();
    expect(
      container.querySelector("[data-slot='character-avatar-loading']"),
    ).toBeNull();
    expect(
      container.querySelector("svg[aria-hidden='true']"),
    ).not.toBeNull();
  });
});
