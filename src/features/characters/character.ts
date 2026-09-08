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
  displayOrder: number;
  isLeader: boolean;
}

export interface CharacterGroup {
  slug: string;
  name: string;
}

export type CharacterStreamerAffiliationType = "mcn" | "group";

export interface CharacterStreamerAffiliation {
  id: string;
  slug: string;
  name: string;
  type: CharacterStreamerAffiliationType;
  sortOrder: number;
}

export interface CharacterListItem {
  id: string;
  streamerId: string;
  slug: string;
  streamerName: string;
  rpName: string | null;
  profileImageUrl: string | null;
  streamerAffiliations: CharacterStreamerAffiliation[];
  affiliations: CharacterAffiliation[];
}

export function getOrderedAffiliations(
  affiliations: CharacterAffiliation[],
): CharacterAffiliation[] {
  return [...affiliations].sort((left, right) => {
    if (left.isPrimary !== right.isPrimary) {
      return left.isPrimary ? -1 : 1;
    }

    if (left.displayOrder !== right.displayOrder) {
      return left.displayOrder - right.displayOrder;
    }

    return left.name.localeCompare(right.name, "ko-KR");
  });
}

export function getOrderedStreamerAffiliations(
  affiliations: CharacterStreamerAffiliation[],
): CharacterStreamerAffiliation[] {
  return [...affiliations].sort((left, right) => {
    if (left.type !== right.type) {
      return left.type === "mcn" ? -1 : 1;
    }

    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return left.name.localeCompare(right.name, "ko-KR");
  });
}
