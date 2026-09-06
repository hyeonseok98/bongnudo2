import { CHARACTER_GROUPS } from "@/constants/character-groups";
import type {
  CharacterAffiliation,
  CharacterGroup,
  CharacterListItem,
} from "@/features/characters/character";

function getGroup(slug: string): CharacterGroup {
  const group = CHARACTER_GROUPS.find((option) => option.slug === slug);

  if (!group) {
    throw new Error(`인물 fixture 그룹을 찾지 못함: ${slug}`);
  }

  return group;
}

function createAffiliation(
  slug: string,
  name: string,
  category: CharacterAffiliation["category"],
  role: string | null,
  isPrimary = true,
  isLeader = false,
): CharacterAffiliation {
  return {
    id: `fixture-affiliation-${slug}-${role ?? "member"}`,
    slug,
    name,
    category,
    role,
    isPrimary,
    isLeader,
  };
}

// 실제 서버 데이터 연결 전 목록 구조와 상호작용을 확인하기 위한 임시 데이터입니다.
export const CHARACTER_FIXTURES: CharacterListItem[] = [
  {
    id: "fixture-gangji",
    slug: "gangji",
    streamerName: "강지",
    rpName: "정감자",
    profileImageUrl: null,
    group: getGroup("stellive"),
    affiliations: [
      createAffiliation("ems", "EMS", "public-service", "병원장", true, true),
      createAffiliation("gangji-store", "강지상회", "business", null, false),
      createAffiliation("dawn-crew", "새벽크루", "crew", null, false),
      createAffiliation("white-night", "백야파", "gang", null, false),
    ],
  },
  {
    id: "fixture-gosudal",
    slug: "gosudal",
    streamerName: "고수달",
    rpName: null,
    profileImageUrl: null,
    group: getGroup("enchant"),
    affiliations: [
      createAffiliation(
        "police",
        "경찰",
        "public-service",
        "경찰청장",
        true,
        true,
      ),
    ],
  },
  {
    id: "fixture-neobul",
    slug: "neobul",
    streamerName: "너불",
    rpName: null,
    profileImageUrl: null,
    group: getGroup("special-network"),
    affiliations: [
      createAffiliation(
        "transportation",
        "교통정비공사",
        "public-service",
        "국장",
        true,
        true,
      ),
    ],
  },
  {
    id: "fixture-lee-chunhyang",
    slug: "lee-chunhyang",
    streamerName: "이춘향",
    rpName: null,
    profileImageUrl: null,
    group: getGroup("injeongmo-network"),
    affiliations: [
      createAffiliation(
        "press",
        "언론",
        "public-service",
        "방송국장",
        true,
        true,
      ),
    ],
  },
  {
    id: "fixture-nambong",
    slug: "nambong",
    streamerName: "남봉",
    rpName: null,
    profileImageUrl: null,
    group: null,
    affiliations: [
      createAffiliation(
        "city-hall",
        "시청",
        "public-service",
        "시장",
        true,
        true,
      ),
    ],
  },
  {
    id: "fixture-nekoneko-mashiro",
    slug: "nekoneko-mashiro",
    streamerName: "네네코 마시로",
    rpName: "마시로",
    profileImageUrl: null,
    group: getGroup("stellive"),
    affiliations: [
      createAffiliation("mashiro-cafe", "마시로 카페", "business", null),
    ],
  },
  {
    id: "fixture-shirayuki-hina",
    slug: "shirayuki-hina",
    streamerName: "시라유키 히나",
    rpName: "히나",
    profileImageUrl: null,
    group: getGroup("stellive"),
    affiliations: [
      createAffiliation("corrections", "교정", "public-service", null),
    ],
  },
  {
    id: "fixture-arahashi-tabi",
    slug: "arahashi-tabi",
    streamerName: "아라하시 타비",
    rpName: null,
    profileImageUrl: null,
    group: getGroup("stellive"),
    affiliations: [],
  },
  {
    id: "fixture-ayatsuno-yuni",
    slug: "ayatsuno-yuni",
    streamerName: "아야츠노 유니",
    rpName: "유니",
    profileImageUrl: null,
    group: getGroup("stellive"),
    affiliations: [
      createAffiliation("police", "경찰", "public-service", "순경"),
    ],
  },
  {
    id: "fixture-gamssoya",
    slug: "gamssoya",
    streamerName: "감쏘야",
    rpName: "감초야",
    profileImageUrl: null,
    group: getGroup("project-i"),
    affiliations: [
      createAffiliation("press", "언론", "public-service", null),
      createAffiliation("herb-shop", "감초상점", "business", null, false),
    ],
  },
  {
    id: "fixture-gochabi",
    slug: "gochabi",
    streamerName: "고차비",
    rpName: null,
    profileImageUrl: null,
    group: getGroup("project-i"),
    affiliations: [
      createAffiliation("gochabi-crew", "고차비 크루", "crew", null),
    ],
  },
  {
    id: "fixture-heeji",
    slug: "heeji",
    streamerName: "희지",
    rpName: "윤희지",
    profileImageUrl: null,
    group: getGroup("project-i"),
    affiliations: [
      createAffiliation("ems", "EMS", "public-service", "구급대원"),
    ],
  },
  {
    id: "fixture-kim-ddolbok",
    slug: "kim-ddolbok",
    streamerName: "김똘복",
    rpName: "김돌쇠",
    profileImageUrl: null,
    group: getGroup("pixel-network"),
    affiliations: [
      createAffiliation("corrections", "교정", "public-service", "교도관"),
    ],
  },
  {
    id: "fixture-runner",
    slug: "runner",
    streamerName: "러너",
    rpName: null,
    profileImageUrl: null,
    group: getGroup("pixel-network"),
    affiliations: [
      createAffiliation("runner-gang", "러너파", "gang", "두목", true, true),
      createAffiliation("runner-crew", "러너크루", "crew", null, false),
    ],
  },
  {
    id: "fixture-kkotbin",
    slug: "kkotbin",
    streamerName: "꽃빈",
    rpName: null,
    profileImageUrl: null,
    group: getGroup("pixel-network"),
    affiliations: [
      createAffiliation("city-hall", "시청", "public-service", null),
    ],
  },
  {
    id: "fixture-geumhwi",
    slug: "geumhwi",
    streamerName: "금휘",
    rpName: "금반장",
    profileImageUrl: null,
    group: getGroup("enchant"),
    affiliations: [
      createAffiliation("gold-room", "황금방", "illegal-business", null),
    ],
  },
];
