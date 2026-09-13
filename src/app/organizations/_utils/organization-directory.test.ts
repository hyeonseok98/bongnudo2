import { describe, expect, it } from "vitest";

import type {
  Organization,
  OrganizationMember,
} from "@/features/organizations/organization";

import {
  buildOrganizationFilterNodes,
  buildOrganizationRoleGroups,
  buildOrganizationSections,
  filterOrganizations,
} from "./organization-directory";

const organizations = [
  createOrganization({
    id: "ems",
    name: "응급의료센터",
    slug: "ems",
    type: "institution",
  }),
  createOrganization({
    id: "cafe",
    name: "봉누도 카페",
    slug: "cafe",
    type: "business",
  }),
];

describe("organization directory", () => {
  it("실제 조직 type과 조직으로 기관 필터 노드를 구성함", () => {
    expect(buildOrganizationFilterNodes(organizations)).toEqual([
      {
        id: "type:institution",
        label: "공무직",
        count: 1,
        children: [{
          id: "organization:ems",
          label: "응급의료센터",
          count: 1,
        }],
      },
      {
        id: "type:business",
        label: "사업체",
        count: 1,
        children: [{
          id: "organization:cafe",
          label: "봉누도 카페",
          count: 1,
        }],
      },
    ]);
  });

  it("조직명 검색과 기관 필터를 함께 적용함", () => {
    expect(
      filterOrganizations(organizations, "ㅇㄱ", {
        ids: ["type:institution"],
      }).map((organization) => organization.id),
    ).toEqual(["ems"]);
    expect(
      filterOrganizations(organizations, "", {
        ids: ["organization:cafe"],
      }).map((organization) => organization.id),
    ).toEqual(["cafe"]);
  });

  it("결과가 있는 조직 종류 section만 구성함", () => {
    expect(buildOrganizationSections([organizations[1]])).toEqual([
      {
        id: "business",
        label: "사업체",
        organizations: [organizations[1]],
      },
    ]);
  });

  it("대표 그룹과 시작일을 기준으로 직책 그룹을 정렬함", () => {
    const organization = createOrganization({
      members: [
        createMember({
          id: "doctor",
          role: "의료진",
          roleStartedAt: "2026-09-14",
          rpName: "의료진",
        }),
        createMember({
          id: "director",
          isLeader: true,
          role: "병원장",
          roleStartedAt: "2026-09-16",
          rpName: "병원장",
        }),
        createMember({
          id: "vice-director",
          role: "부원장",
          roleStartedAt: "2026-09-15",
          rpName: "부원장",
        }),
      ],
    });

    expect(
      buildOrganizationRoleGroups(organization).map((group) => group.label),
    ).toEqual(["병원장", "의료진", "부원장"]);
  });
});

function createOrganization(
  overrides: Partial<Organization> = {},
): Organization {
  return {
    id: "organization",
    logoImageUrl: null,
    members: [],
    name: "조직",
    slug: "organization",
    type: "institution",
    ...overrides,
  };
}

function createMember(
  overrides: Partial<OrganizationMember> = {},
): OrganizationMember {
  return {
    id: "member",
    displayOrder: 1,
    isLeader: false,
    profileImageUrl: null,
    role: null,
    roleStartedAt: null,
    rpName: "구성원",
    ...overrides,
  };
}
