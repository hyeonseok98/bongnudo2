"use client";

import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

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
import { DatePicker } from "@/components/ui/date-picker";
import { SearchField } from "@/components/ui/search-field";
import { Select } from "@/components/ui/select";
import type {
  TimelineCategory,
  TimelinePopularTag,
} from "@/features/timeline/timeline";
import { getSeason2OperationalDays } from "@/features/timeline/season2-operational-day";

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
  const operationalDays = getSeason2OperationalDays(
    `${today}T23:59:59+09:00`,
  );
  const lastOperationalDay = operationalDays.at(-1)?.day ?? 0;
  const selectedFilters = [
    directory.job
      ? { id: "job", label: findNodeLabel(jobNodes, directory.job) ?? directory.job }
      : null,
    directory.affiliation
      ? {
          id: "affiliation",
          label:
            findNodeLabel(affiliationNodes, directory.affiliation) ??
            directory.affiliation,
        }
      : null,
    directory.participant
      ? {
          id: "participant",
          label: selectedParticipantLabel ?? "선택된 인물",
        }
      : null,
    directory.tag
      ? {
          id: "tag",
          label:
            `#${popularTags.find((tag) => tag.slug === directory.tag)?.name ?? directory.tag}`,
        }
      : null,
  ].filter((filter): filter is { id: string; label: string } => filter !== null);

  function removeFilter(id: string): void {
    if (id === "job") directory.changeJob("");
    if (id === "affiliation") directory.changeAffiliation("");
    if (id === "participant") directory.changeParticipant("");
    if (id === "tag") directory.changeTag("");
  }

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
        <span className="text-body-sm font-medium text-secondary">기준</span>
        <div className="inline-flex rounded-lg border border-default bg-background p-1">
          {([
            { label: "날짜별", value: "date" },
            { label: "일차별", value: "day" },
          ] as const).map((option) => (
            <button
              aria-pressed={directory.viewMode === option.value}
              className="cursor-pointer rounded-md px-3 py-1.5 text-body-sm font-semibold text-secondary transition-colors hover:text-primary aria-pressed:bg-surface-selected aria-pressed:text-primary"
              key={option.value}
              onClick={() => directory.changeViewMode(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
        <Button
          aria-label={directory.viewMode === "date" ? "이전 날짜" : "이전 일차"}
          disabled={directory.viewMode === "day" && directory.day <= 0}
          size="icon"
          variant="outline"
          onClick={() =>
            directory.viewMode === "date"
              ? directory.moveDate(-1)
              : directory.moveDay(-1)
          }
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        {directory.viewMode === "date" ? (
          <DatePicker
            className="h-10 w-40 font-semibold"
            label="타임라인 날짜"
            max={today}
            onValueChange={directory.changeDate}
            value={directory.date}
          />
        ) : (
          <Select
            className="w-40"
            label="봉누도2 운영 일차"
            onValueChange={(value) => directory.changeDay(Number(value))}
            options={operationalDays.map((day) => ({
              label: day.label,
              value: String(day.day),
            }))}
            value={String(directory.day)}
          />
        )}
        <Button
          aria-label={directory.viewMode === "date" ? "다음 날짜" : "다음 일차"}
          disabled={
            directory.viewMode === "date"
              ? directory.date >= today
              : directory.day >= lastOperationalDay
          }
          size="icon"
          variant="outline"
          onClick={() =>
            directory.viewMode === "date"
              ? directory.moveDate(1)
              : directory.moveDay(1)
          }
        >
          <ChevronRight aria-hidden="true" />
        </Button>
        {directory.viewMode === "date" ? (
          <Button
            disabled={directory.date === today}
            size="sm"
            variant="outline"
            onClick={() => directory.changeDate(today)}
          >
            오늘
          </Button>
        ) : null}
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
          label="조직"
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

      {selectedFilters.length > 0 ? (
        <div className="flex min-h-12 flex-wrap items-center gap-2 border-y border-default py-2">
          <Button onClick={directory.clearFilters} size="sm" variant="ghost">
            <RotateCcw aria-hidden="true" />
            전체 초기화
          </Button>
          {selectedFilters.map((filter) => (
            <Chip
              key={filter.id}
              mode="removable"
              onRemove={() => removeFilter(filter.id)}
              removeLabel={`${filter.label} 필터 제거`}
            >
              {filter.label}
            </Chip>
          ))}
        </div>
      ) : null}

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
              #{tag.name}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function findNodeLabel(nodes: FilterTreeNode[], id: string): string | null {
  for (const node of nodes) {
    if (node.id === id) return node.label;
    const childLabel = node.children ? findNodeLabel(node.children, id) : null;
    if (childLabel) return childLabel;
  }
  return null;
}
