"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import type { TimelineDirectory } from "../_hooks/use-timeline-directory";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import {
  HierarchicalFilter,
  type FilterTreeNode,
  type HierarchicalFilterSelection,
  type QuickFilterOption,
} from "@/components/filters/hierarchical-filter";
import { FilterBar } from "@/components/filters/filter-bar";
import { SearchField } from "@/components/ui/search-field";
import { PickerInput } from "@/components/ui/picker-input";
import type {
  TimelineCategory,
  TimelinePopularTag,
} from "@/features/timeline/timeline";

import { ParticipantFilter } from "./participant-filter";

interface TimelineFiltersProps {
  affiliationNodes: FilterTreeNode[];
  affiliationQuickOptions: QuickFilterOption[];
  categories: TimelineCategory[];
  directory: TimelineDirectory;
  getAffiliationResultCount: (
    selection: HierarchicalFilterSelection,
  ) => number;
  getJobResultCount: (selection: HierarchicalFilterSelection) => number;
  jobNodes: FilterTreeNode[];
  popularTags: TimelinePopularTag[];
  selectedParticipantLabel: string | null;
  today: string;
}

export function TimelineFilters({
  affiliationNodes,
  affiliationQuickOptions,
  categories,
  directory,
  getAffiliationResultCount,
  getJobResultCount,
  jobNodes,
  popularTags,
  selectedParticipantLabel,
  today,
}: TimelineFiltersProps) {
  return (
    <section aria-label="타임라인 검색 및 필터" className="space-y-4">
      <SearchField
        label="타임라인 검색"
        onChange={(event) => directory.changeQuery(event.target.value)}
        onClear={() => directory.changeQuery("")}
        placeholder="사건, 인물, 해시태그로 타임라인을 검색해보세요."
        value={directory.query}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          aria-label="이전 날짜"
          size="icon"
          variant="outline"
          onClick={() => directory.moveDate(-1)}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <PickerInput
          aria-label="타임라인 날짜"
          className="h-10 w-auto cursor-pointer font-semibold"
          max={today}
          onChange={(event) => directory.changeDate(event.target.value)}
          type="date"
          value={directory.date}
        />
        <Button
          aria-label="다음 날짜"
          disabled={directory.date >= today}
          size="icon"
          variant="outline"
          onClick={() => directory.moveDate(1)}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
        <Button
          disabled={directory.date === today}
          size="sm"
          variant="outline"
          onClick={() => directory.changeDate(today)}
        >
          오늘
        </Button>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="카테고리 필터">
        <Chip
          isSelected={!directory.category}
          onClick={() => directory.changeCategory("")}
        >
          전체
        </Chip>
        {categories.map((category) => (
          <Chip
            isSelected={directory.category === category.slug}
            key={category.slug}
            onClick={() => directory.changeCategory(category.slug)}
          >
            {category.name}
          </Chip>
        ))}
      </div>

      <FilterBar>
        <HierarchicalFilter
          applyLabel="적용"
          getResultCount={getJobResultCount}
          label="직업"
          nodes={jobNodes}
          onApply={(selection) =>
            directory.changeJob(selection.ids[0] ?? "")
          }
          panelSize="compact"
          selectionMode="single"
          value={{ ids: directory.job ? [directory.job] : [] }}
        />
        <HierarchicalFilter
          applyLabel="적용"
          getResultCount={getAffiliationResultCount}
          label="소속"
          nodes={affiliationNodes}
          onApply={(selection) =>
            directory.changeAffiliation(selection.ids[0] ?? "")
          }
          quickOptions={affiliationQuickOptions}
          selectionMode="single"
          value={{
            ids: directory.affiliation ? [directory.affiliation] : [],
          }}
        />
        <ParticipantFilter
          onValueChange={directory.changeParticipant}
          selectedLabel={selectedParticipantLabel}
          value={directory.participant}
        />
      </FilterBar>

      {popularTags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-caption font-semibold text-secondary">인기 태그</span>
          {popularTags.map((tag) => (
            <button
              aria-pressed={directory.tag === tag.slug}
              className={
                directory.tag === tag.slug
                  ? "cursor-pointer rounded-md bg-brand px-2 py-1 text-caption font-medium text-brand-foreground"
                  : "cursor-pointer rounded-md bg-surface-muted px-2 py-1 text-caption font-medium text-secondary transition-colors duration-default hover:text-primary"
              }
              key={tag.slug}
              onClick={() =>
                directory.changeTag(directory.tag === tag.slug ? "" : tag.slug)
              }
              type="button"
            >
              #{tag.name} {tag.usageCount}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
