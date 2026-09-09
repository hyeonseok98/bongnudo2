"use client";

import { FilterBar } from "@/components/filters/filter-bar";
import {
  HierarchicalFilter,
  type FilterTreeNode,
  type QuickFilterOption,
} from "@/components/filters/hierarchical-filter";
import { SearchField } from "@/components/ui/search-field";

interface CharacterFiltersProps {
  getJobResultCount: (value: string[]) => number;
  getStreamerAffiliationResultCount: (value: string[]) => number;
  jobLabelNodes: FilterTreeNode[];
  jobNodes: FilterTreeNode[];
  jobValue: string[];
  query: string;
  selectedStreamerAffiliationSlugs: string[];
  streamerAffiliationNodes: FilterTreeNode[];
  streamerAffiliationLabelNodes: FilterTreeNode[];
  streamerAffiliationQuickOptions: QuickFilterOption[];
  onJobApply: (value: string[]) => void;
  onQueryChange: (query: string) => void;
  onStreamerAffiliationsApply: (value: string[]) => void;
}

export function CharacterFilters({
  getJobResultCount,
  getStreamerAffiliationResultCount,
  jobLabelNodes,
  jobNodes,
  jobValue,
  query,
  selectedStreamerAffiliationSlugs,
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
          quickOptions={[]}
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
          value={selectedStreamerAffiliationSlugs}
        />
      </FilterBar>
    </section>
  );
}
