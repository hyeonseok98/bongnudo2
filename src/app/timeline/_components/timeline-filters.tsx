"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import type { TimelineDirectory } from "../_hooks/use-timeline-directory";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import {
  FilterSelect,
  type FilterSelectOption,
} from "@/components/filters/filter-select";
import { SearchField } from "@/components/ui/search-field";
import type {
  TimelineCategory,
  TimelinePopularTag,
} from "@/features/timeline/timeline";

import { ParticipantFilter } from "./participant-filter";

interface TimelineFiltersProps {
  affiliationOptions: readonly FilterSelectOption[];
  categories: TimelineCategory[];
  directory: TimelineDirectory;
  jobOptions: readonly FilterSelectOption[];
  popularTags: TimelinePopularTag[];
  selectedParticipantLabel: string | null;
  today: string;
}

export function TimelineFilters({
  affiliationOptions,
  categories,
  directory,
  jobOptions,
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
        <label className="relative">
          <CalendarDays
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-tertiary"
          />
          <input
            aria-label="타임라인 날짜"
            className="h-10 cursor-pointer rounded-lg border border-default bg-background pr-3 pl-10 text-body-sm font-semibold text-primary focus:border-focus-ring focus:outline-none"
            onChange={(event) => directory.changeDate(event.target.value)}
            type="date"
            value={directory.date}
          />
        </label>
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

      <div className="flex flex-wrap gap-2">
        <FilterSelect
          label="직업"
          onValueChange={directory.changeJob}
          options={jobOptions}
          value={directory.job}
        />
        <FilterSelect
          label="소속"
          onValueChange={directory.changeAffiliation}
          options={affiliationOptions}
          value={directory.affiliation}
        />
        <ParticipantFilter
          onValueChange={directory.changeParticipant}
          selectedLabel={selectedParticipantLabel}
          value={directory.participant}
        />
      </div>

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
