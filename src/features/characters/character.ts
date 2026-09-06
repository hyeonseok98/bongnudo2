export type CharacterAffiliationCategory =
  | "public-service"
  | "business"
  | "illegal-business"
  | "gang"
  | "crew";

export interface CharacterAffiliation {
  id: string;
  slug: string;
  name: string;
  category: CharacterAffiliationCategory;
  role: string | null;
  isPrimary: boolean;
  isLeader: boolean;
}

export interface CharacterGroup {
  slug: string;
  name: string;
}

export interface CharacterListItem {
  id: string;
  slug: string;
  streamerName: string;
  rpName: string | null;
  profileImageUrl: string | null;
  group: CharacterGroup | null;
  affiliations: CharacterAffiliation[];
}

export function getOrderedAffiliations(
  affiliations: CharacterAffiliation[],
): CharacterAffiliation[] {
  return [...affiliations].sort((left, right) => {
    if (left.isPrimary !== right.isPrimary) {
      return left.isPrimary ? -1 : 1;
    }

    if (
      left.category === "public-service" &&
      right.category !== "public-service"
    ) {
      return -1;
    }

    if (
      left.category !== "public-service" &&
      right.category === "public-service"
    ) {
      return 1;
    }

    return left.name.localeCompare(right.name, "ko-KR");
  });
}
