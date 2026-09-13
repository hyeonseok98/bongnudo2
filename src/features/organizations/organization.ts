export interface OrganizationMember {
  id: string;
  displayOrder: number;
  isLeader: boolean;
  profileImageUrl: string | null;
  role: string | null;
  roleStartedAt: string | null;
  rpName: string;
}

export interface Organization {
  id: string;
  logoImageUrl: string | null;
  members: OrganizationMember[];
  name: string;
  slug: string;
  type: string;
}

export interface OrganizationRoleGroup {
  id: string;
  label: string;
  members: OrganizationMember[];
}

const ORGANIZATION_TYPE_OPTIONS = [
  { type: "institution", label: "공무직" },
  { type: "business", label: "사업체" },
  { type: "illegal-business", label: "불법사업체" },
  { type: "gang", label: "갱단" },
  { type: "crew", label: "크루" },
] as const;

export function getOrganizationTypeLabel(type: string): string {
  return ORGANIZATION_TYPE_OPTIONS.find((option) => option.type === type)
    ?.label ?? type;
}

export function compareOrganizationTypes(left: string, right: string): number {
  const leftIndex = ORGANIZATION_TYPE_OPTIONS.findIndex(
    (option) => option.type === left,
  );
  const rightIndex = ORGANIZATION_TYPE_OPTIONS.findIndex(
    (option) => option.type === right,
  );

  if (leftIndex === -1 && rightIndex === -1) {
    return getOrganizationTypeLabel(left).localeCompare(
      getOrganizationTypeLabel(right),
      "ko-KR",
    );
  }

  if (leftIndex === -1) {
    return 1;
  }

  if (rightIndex === -1) {
    return -1;
  }

  return leftIndex - rightIndex;
}
