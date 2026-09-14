"use client";

import { CharacterGrid } from "@/app/characters/_components/character-grid";
import { useCharacters } from "@/app/characters/_hooks/use-characters";
import {
  buildCharacterDirectoryItems,
  sortCharacterDirectoryItems,
} from "@/app/characters/_utils/character-directory";

import {
  HomeDirectoryLink,
  HomeSectionMessage,
} from "./home-section";

const HOME_CHARACTER_COUNT = 6;

export function HomeCharacters() {
  const charactersQuery = useCharacters();
  const items = sortCharacterDirectoryItems(
    buildCharacterDirectoryItems(
      charactersQuery.data?.characters ?? [],
      "streamer",
    ),
    "asc",
  ).slice(0, HOME_CHARACTER_COUNT);

  return (
    <section aria-labelledby="home-characters-heading" className="space-y-4">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h2
            className="text-heading-sm font-semibold text-primary"
            id="home-characters-heading"
          >
            인물 도감
          </h2>
          <p className="mt-1 text-body-sm text-secondary">
            봉누도2에서 살아가는 인물들
          </p>
        </div>
        <HomeDirectoryLink href="/characters">전체보기</HomeDirectoryLink>
      </header>

      {charactersQuery.isPending ? (
        <HomeSectionMessage>인물 정보를 불러오는 중입니다.</HomeSectionMessage>
      ) : charactersQuery.isError ? (
        <HomeSectionMessage isError>
          인물 정보를 불러오지 못했습니다.
        </HomeSectionMessage>
      ) : items.length > 0 ? (
        <CharacterGrid items={items} />
      ) : (
        <HomeSectionMessage>등록된 인물이 없습니다.</HomeSectionMessage>
      )}
    </section>
  );
}
