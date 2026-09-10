"use client";

import { FilterBar } from "@/components/filters/filter-bar";
import {
  HierarchicalFilter,
  type FilterTreeNode,
  type HierarchicalFilterSelection,
  type QuickFilterOption,
} from "@/components/filters/hierarchical-filter";
import { SearchField } from "@/components/ui/search-field";

interface CharacterFiltersProps {
  getJobResultCount: (selection: HierarchicalFilterSelection) => number;
  getStreamerAffiliationResultCount: (
    selection: HierarchicalFilterSelection,
  ) => number;
  jobLabelNodes: FilterTreeNode[];
  jobNodes: FilterTreeNode[];
  jobValue: HierarchicalFilterSelection;
  query: string;
  streamerAffiliationSelection: HierarchicalFilterSelection;
  streamerAffiliationNodes: FilterTreeNode[];
  streamerAffiliationLabelNodes: FilterTreeNode[];
  streamerAffiliationQuickOptions: QuickFilterOption[];
  onJobApply: (selection: HierarchicalFilterSelection) => void;
  onQueryChange: (query: string) => void;
  onStreamerAffiliationsApply: (
    selection: HierarchicalFilterSelection,
  ) => void;
}

export function CharacterFilters({
  getJobResultCount,
  getStreamerAffiliationResultCount,
  jobLabelNodes,
  jobNodes,
  jobValue,
  query,
  streamerAffiliationSelection,
  streamerAffiliationNodes,
  streamerAffiliationLabelNodes,
  streamerAffiliationQuickOptions,
  onJobApply,
  onQueryChange,
  onStreamerAffiliationsApply,
}: CharacterFiltersProps) {
  return (
    <section aria-label="인물 검색 및 필터" className="space-y-3">
      <SearchField
        label="이름 또는 키워드 검색"
        onChange={(event) => onQueryChange(event.target.value)}
        onClear={() => onQueryChange("")}
        placeholder="이름 또는 키워드로 검색해보세요."
        value={query}
      />

      <FilterBar>
        <HierarchicalFilter
          getResultCount={getJobResultCount}
          label="직업"
          labelNodes={jobLabelNodes}
          nodes={jobNodes}
          onApply={onJobApply}
          panelSize="compact"
          selectionMode="single"
          value={jobValue}
        />
        <HierarchicalFilter
          getResultCount={getStreamerAffiliationResultCount}
          label="소속"
          labelNodes={streamerAffiliationLabelNodes}
          nodes={streamerAffiliationNodes}
          onApply={onStreamerAffiliationsApply}
          quickOptions={streamerAffiliationQuickOptions}
          value={streamerAffiliationSelection}
        />
      </FilterBar>
    </section>
  );
}
