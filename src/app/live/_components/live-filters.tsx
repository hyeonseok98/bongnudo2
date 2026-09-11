"use client";

import { FilterBar } from "@/components/filters/filter-bar";
import {
  HierarchicalFilter,
  type FilterTreeNode,
  type HierarchicalFilterSelection,
  type QuickFilterOption,
} from "@/components/filters/hierarchical-filter";
import { SearchField } from "@/components/ui/search-field";

interface LiveFiltersProps {
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

export function LiveFilters({
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
}: LiveFiltersProps) {
  return (
    <section aria-label="LIVE 검색 및 필터" className="space-y-3">
      <SearchField
        label="RP명 또는 스트리머명 검색"
        onChange={(event) => onQueryChange(event.target.value)}
        onClear={() => onQueryChange("")}
        placeholder="RP명 또는 스트리머명으로 검색해보세요."
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
