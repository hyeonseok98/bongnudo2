"use client";

import { FilterBar } from "@/components/filters/filter-bar";
import {
  getFilterNodeLabel,
  HierarchicalFilter,
  type HierarchicalFilterSelection,
} from "@/components/filters/hierarchical-filter";
import { SearchField } from "@/components/ui/search-field";

import { SelectedFilterSummary } from "../../characters/_components/selected-filter-summary";
import { useOrganizationDirectory } from "../_hooks/use-organization-directory";
import { useOrganizations } from "../_hooks/use-organizations";
import {
  buildOrganizationFilterNodes,
  buildOrganizationSections,
  filterOrganizations,
} from "../_utils/organization-directory";
import { OrganizationCard } from "./organization-card";

export function OrganizationsContent() {
  const directory = useOrganizationDirectory();
  const organizationsQuery = useOrganizations();
  const organizations = organizationsQuery.data ?? [];
  const filterNodes = buildOrganizationFilterNodes(organizations);
  const filteredOrganizations = filterOrganizations(
    organizations,
    directory.q,
    directory.institutionSelection,
  );
  const sections = buildOrganizationSections(filteredOrganizations);
  const selectedInstitutions = directory.institutionSelection.ids.map((id) => ({
    id,
    label: getFilterNodeLabel(filterNodes, id) ?? id,
  }));

  function getInstitutionResultCount(
    selection: HierarchicalFilterSelection,
  ): number {
    return filterOrganizations(organizations, directory.q, selection).length;
  }

  if (organizationsQuery.isPending) {
    return (
      <div className="space-y-6">
        <OrganizationDirectoryHeading />
        <p className="text-body-sm text-secondary" role="status">
          조직 정보를 불러오는 중입니다.
        </p>
      </div>
    );
  }

  if (organizationsQuery.isError) {
    return (
      <div className="space-y-6">
        <OrganizationDirectoryHeading />
        <p className="text-body-sm text-destructive" role="alert">
          조직 정보를 불러오지 못했습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <OrganizationDirectoryHeading />

      <section aria-label="조직 검색 및 필터" className="space-y-3">
        <SearchField
          label="조직명 검색"
          onChange={(event) => directory.changeQuery(event.target.value)}
          onClear={() => directory.changeQuery("")}
          placeholder="조직명으로 검색해보세요."
          value={directory.q}
        />
        <FilterBar>
          <HierarchicalFilter
            getResultCount={getInstitutionResultCount}
            label="기관"
            nodes={filterNodes}
            onApply={directory.applyInstitutions}
            panelSize="compact"
            value={directory.institutionSelection}
          />
        </FilterBar>
      </section>

      <SelectedFilterSummary
        selectedJobs={selectedInstitutions}
        selectedStreamerAffiliations={[]}
        onClearAll={directory.resetFilters}
        onRemoveJob={directory.removeInstitution}
        onRemoveStreamerAffiliation={() => undefined}
      />

      <section
        aria-labelledby="organization-results-heading"
        className="space-y-6"
      >
        <h2
          className="text-body-sm text-secondary"
          id="organization-results-heading"
        >
          총{" "}
          <strong className="font-semibold text-brand-text">
            {filteredOrganizations.length}개
          </strong>
          의 조직이 등록되어 있습니다.
        </h2>

        {sections.length > 0 ? (
          sections.map((section) => (
            <section
              aria-labelledby={`organization-section-${section.id}`}
              key={section.id}
            >
              <div className="mb-3 flex items-center gap-4">
                <h3
                  className="shrink-0 text-heading-sm font-semibold text-primary"
                  id={`organization-section-${section.id}`}
                >
                  {section.label}
                </h3>
                <div
                  aria-hidden="true"
                  className="h-px flex-1 bg-border-default"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {section.organizations.map((organization) => (
                  <OrganizationCard
                    key={organization.id}
                    organization={organization}
                  />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center bg-surface-muted px-5 py-10 text-center">
            <p className="text-heading-sm font-semibold text-primary">
              조건에 맞는 조직이 없습니다.
            </p>
            <p className="mt-1 text-body-sm text-secondary">
              검색어나 선택한 필터를 변경해보세요.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function OrganizationDirectoryHeading() {
  return (
    <div>
      <h1 className="text-title font-bold text-primary">조직 도감</h1>
      <p className="mt-1 text-body text-secondary">
        현재 Beta버전으로 추후 업데이트 예정
      </p>
    </div>
  );
}
