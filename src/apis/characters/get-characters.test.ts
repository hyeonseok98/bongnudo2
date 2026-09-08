import { describe, expect, it } from "vitest";

import { toCharacterListItem } from "./get-characters";

describe("toCharacterListItem", () => {
  it("현실 소속과 현재 RP 조직을 새 구조의 정렬 규칙으로 변환함", () => {
    const character = toCharacterListItem({
      id: "participant",
      rp_name: null,
      streamer: {
        id: "streamer",
        slug: "streamer",
        name: "스트리머",
        affiliation_memberships: [
          {
            id: "group-membership",
            sort_order: 1,
            affiliation: {
              id: "group",
              slug: "mountain-club",
              name: "산악회",
              type: "group",
            },
          },
          {
            id: "second-mcn-membership",
            sort_order: 2,
            affiliation: {
              id: "second-mcn",
              slug: "second-mcn",
              name: "두 번째 MCN",
              type: "mcn",
            },
          },
          {
            id: "first-mcn-membership",
            sort_order: 1,
            affiliation: {
              id: "first-mcn",
              slug: "first-mcn",
              name: "첫 번째 MCN",
              type: "mcn",
            },
          },
        ],
      },
      memberships: [
        {
          id: "secondary",
          is_primary: false,
          display_order: 1,
          organization: {
            id: "secondary-organization",
            slug: "secondary-organization",
            name: "보조 조직",
            type: "institution",
          },
          role_histories: [
            {
              id: "secondary-role",
              role: "구성원",
              start_date: null,
              end_date: null,
              is_leader: false,
            },
          ],
        },
        {
          id: "primary-second",
          is_primary: true,
          display_order: 2,
          organization: {
            id: "primary-second-organization",
            slug: "primary-second-organization",
            name: "주 조직 2",
            type: "institution",
          },
          role_histories: [
            {
              id: "primary-second-role",
              role: null,
              start_date: null,
              end_date: null,
              is_leader: false,
            },
          ],
        },
        {
          id: "primary-first",
          is_primary: true,
          display_order: 1,
          organization: {
            id: "primary-first-organization",
            slug: "primary-first-organization",
            name: "주 조직 1",
            type: "institution",
          },
          role_histories: [
            {
              id: "ended-role",
              role: "과거 직책",
              start_date: null,
              end_date: "2026-09-01",
              is_leader: false,
            },
            {
              id: "current-role",
              role: "현재 직책",
              start_date: null,
              end_date: null,
              is_leader: true,
            },
          ],
        },
        {
          id: "ended-membership",
          is_primary: false,
          display_order: 2,
          organization: {
            id: "ended-organization",
            slug: "ended-organization",
            name: "과거 조직",
            type: "institution",
          },
          role_histories: [
            {
              id: "only-ended-role",
              role: "과거 직책",
              start_date: null,
              end_date: "2026-09-01",
              is_leader: true,
            },
          ],
        },
      ],
    });

    expect(character.rpName).toBeNull();
    expect(character.streamerAffiliations.map(({ type, slug }) => [type, slug]))
      .toEqual([
        ["mcn", "first-mcn"],
        ["mcn", "second-mcn"],
        ["group", "mountain-club"],
      ]);
    expect(character.affiliations.map(({ slug }) => slug)).toEqual([
      "primary-first-organization",
      "primary-second-organization",
      "secondary-organization",
    ]);
    expect(character.affiliations[0]).toMatchObject({
      role: "현재 직책",
      isLeader: true,
      isPrimary: true,
      displayOrder: 1,
    });
  });
});
