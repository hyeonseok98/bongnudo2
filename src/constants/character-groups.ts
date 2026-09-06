import type { CharacterGroup } from "@/features/characters/character";

export const FEATURED_CHARACTER_GROUP_SLUGS = [
  "stellive",
  "project-i",
  "pixel-network",
] as const;

export const CHARACTER_GROUPS = [
  { slug: "stellive", name: "스텔라이브" },
  { slug: "project-i", name: "프로젝트 아이" },
  { slug: "pixel-network", name: "픽셀네트워크" },
  { slug: "injeongmo-network", name: "인정모 네트워크" },
  { slug: "enchant", name: "인챈트" },
  { slug: "special-network", name: "특별네트워크" },
] satisfies readonly CharacterGroup[];

export function isCharacterGroupSlug(value: string): boolean {
  return CHARACTER_GROUPS.some((group) => group.slug === value);
}
