import type {
  FilterTreeNode,
  HierarchicalFilterSelection,
} from "@/components/filters/hierarchical-filter";
import {
  compareOrganizationTypes,
  getOrganizationTypeLabel,
  type Organization,
  type OrganizationRoleGroup,
} from "@/features/organizations/organization";
import { matchesKoreanSearch } from "@/utils/korean-search";

export interface OrganizationSection {
  id: string;
  label: string;
  organizations: Organization[];
}

export function buildOrganizationFilterNodes(
  organizations: Organization[],
): FilterTreeNode[] {
  return getOrganizationTypes(organizations).map((type) => {
    const typeOrganizations = organizations.filter(
      (organization) => organization.type === type,
    );

    return {
      id: getTypeFilterId(type),
      label: getOrganizationTypeLabel(type),
      count: typeOrganizations.length,
      children: typeOrganizations.map((organization) => ({
        id: getOrganizationFilterId(organization.slug),
        label: organization.name,
        count: 1,
      })),
    };
  });
}

export function filterOrganizations(
  organizations: Organization[],
  query: string,
  selection: HierarchicalFilterSelection,
): Organization[] {
  return organizations.filter((organization) => {
    const matchesQuery = matchesKoreanSearch(organization.name, query);
    const matchesInstitution =
      selection.ids.length === 0
      || selection.ids.includes(getTypeFilterId(organization.type))
      || selection.ids.includes(getOrganizationFilterId(organization.slug));

    return matchesQuery && matchesInstitution;
  });
}

export function buildOrganizationSections(
  organizations: Organization[],
): OrganizationSection[] {
  return getOrganizationTypes(organizations).flatMap((type) => {
    const typeOrganizations = organizations
      .filter((organization) => organization.type === type)
      .sort((left, right) => left.name.localeCompare(right.name, "ko-KR"));

    return typeOrganizations.length > 0
      ? [{
          id: type,
          label: getOrganizationTypeLabel(type),
          organizations: typeOrganizations,
        }]
      : [];
  });
}

export function buildOrganizationRoleGroups(
  organization: Organization,
): OrganizationRoleGroup[] {
  const groupsByRole = new Map<string, OrganizationRoleGroup>();

  for (const member of organization.members) {
    const label = member.role ?? "직책 없음";
    const group = groupsByRole.get(label) ?? {
      id: label,
      label,
      members: [],
    };
    group.members.push(member);
    groupsByRole.set(label, group);
  }

  return [...groupsByRole.values()]
    .map((group) => ({
      ...group,
      members: group.members.sort((left, right) => {
        if (left.isLeader !== right.isLeader) {
          return left.isLeader ? -1 : 1;
        }

        if (left.displayOrder !== right.displayOrder) {
          return left.displayOrder - right.displayOrder;
        }

        return left.rpName.localeCompare(right.rpName, "ko-KR");
      }),
    }))
    .sort((left, right) => {
      const leftIsLeader = left.members.some((member) => member.isLeader);
      const rightIsLeader = right.members.some((member) => member.isLeader);

      if (leftIsLeader !== rightIsLeader) {
        return leftIsLeader ? -1 : 1;
      }

      const leftStartDate = getFirstRoleStartDate(left);
      const rightStartDate = getFirstRoleStartDate(right);

      if (leftStartDate !== rightStartDate) {
        return leftStartDate.localeCompare(rightStartDate);
      }

      return left.label.localeCompare(right.label, "ko-KR");
    });
}

function getOrganizationTypes(organizations: Organization[]): string[] {
  return [...new Set(organizations.map((organization) => organization.type))]
    .sort(compareOrganizationTypes);
}

function getFirstRoleStartDate(group: OrganizationRoleGroup): string {
  return group.members
    .flatMap((member) => member.roleStartedAt ?? [])
    .sort()[0] ?? "9999-12-31";
}

function getTypeFilterId(type: string): string {
  return "type:" + type;
}

function getOrganizationFilterId(slug: string): string {
  return "organization:" + slug;
}
