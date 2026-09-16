"use client";

import {
  buildJobAffiliationFilterNodes,
  buildStreamerAffiliationFilterData,
} from "@/app/characters/_utils/character-directory";
import { FilterBar } from "@/components/filters/filter-bar";
import {
  HierarchicalFilter,
  type HierarchicalFilterSelection,
} from "@/components/filters/hierarchical-filter";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { SearchField } from "@/components/ui/search-field";
import { Select } from "@/components/ui/select";
import type { ClipOptions } from "@/features/clips/clip";
import type {
  CharacterListItem,
  StreamerAffiliation,
} from "@/features/characters/character";
import { getCurrentKstDate } from "@/features/seasons/season-date";

interface ClipFiltersProps {
  characters: CharacterListItem[];
  date: string | null;
  day: number | null;
  groups: HierarchicalFilterSelection;
  jobs: HierarchicalFilterSelection;
  options: ClipOptions;
  participantId: string | null;
  query: string;
  searchLabel?: string;
  streamerAffiliations: StreamerAffiliation[];
  onDateChange: (date: string | null) => void;
  onDayChange: (day: number | null) => void;
  onGroupsApply: (selection: HierarchicalFilterSelection) => void;
  onJobsApply: (selection: HierarchicalFilterSelection) => void;
  onParticipantChange: (participantId: string | null) => void;
  onQueryChange: (query: string) => void;
  onReset: () => void;
}

export function ClipFilters({
  characters,
  date,
  day,
  groups,
  jobs,
  options,
  participantId,
  query,
  searchLabel = "클립 검색",
  streamerAffiliations,
  onDateChange,
  onDayChange,
  onGroupsApply,
  onJobsApply,
  onParticipantChange,
  onQueryChange,
  onReset,
}: ClipFiltersProps) {
  const jobNodes = buildJobAffiliationFilterNodes(characters);
  const groupFilterData = buildStreamerAffiliationFilterData(
    characters,
    streamerAffiliations,
  );
  const participantNodes = characters
    .filter((character) => character.rpName !== null)
    .map((character) => ({
      id: character.id,
      label: character.rpName ?? character.streamerName,
    }))
    .sort((left, right) => left.label.localeCompare(right.label, "ko-KR"));
  const dayValue = day === null ? "all" : String(day);
  const participantSelection = {
    ids: participantId ? [participantId] : [],
  };

  function getResultCount(selection: HierarchicalFilterSelection): number {
    return selection.ids.length === 0 ? characters.length : selection.ids.length;
  }

  return (
    <section aria-label="클립 검색 및 필터" className="space-y-3">
      <SearchField
        label={searchLabel}
        onChange={(event) => onQueryChange(event.target.value)}
        onClear={() => onQueryChange("")}
        placeholder="스트리머명 또는 RP 캐릭터 이름으로 검색해보세요"
        value={query}
      />

      <FilterBar>
        <Select
          label="봉누도 일차"
          onValueChange={(value) => onDayChange(value === "all" ? null : Number(value))}
          options={[
            { label: "봉누도 일차 전체", value: "all" },
            ...options.seasonDays.map((seasonDay) => ({
              label: `${seasonDay.dayNumber}일차 · ${seasonDay.sessionDate}`,
              value: String(seasonDay.dayNumber),
            })),
          ]}
          value={dayValue}
        />
        <div className="flex items-center gap-1">
          <DatePicker
            className="w-44"
            label="클립 날짜"
            max={getCurrentKstDate()}
            onValueChange={onDateChange}
            placeholder="날짜 선택"
            value={date}
          />
          {date ? (
            <Button
              aria-label="날짜 필터 지우기"
              onClick={() => onDateChange(null)}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              ×
            </Button>
          ) : null}
        </div>
        <HierarchicalFilter
          getResultCount={getResultCount}
          label="직업"
          nodes={jobNodes}
          onApply={onJobsApply}
          panelSize="compact"
          value={jobs}
        />
        <HierarchicalFilter
          getResultCount={getResultCount}
          label="소속"
          nodes={groupFilterData.nodes}
          onApply={onGroupsApply}
          quickOptions={groupFilterData.quickOptions}
          value={groups}
        />
        <HierarchicalFilter
          getResultCount={getResultCount}
          label="인물"
          nodes={participantNodes}
          onApply={(selection) => onParticipantChange(selection.ids[0] ?? null)}
          panelSize="compact"
          selectionMode="single"
          value={participantSelection}
        />
        <Button onClick={onReset} size="sm" type="button" variant="ghost">
          필터 초기화
        </Button>
      </FilterBar>
    </section>
  );
}
