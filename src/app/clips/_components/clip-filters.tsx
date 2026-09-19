"use client";

import {
  buildJobAffiliationFilterNodes,
  buildStreamerAffiliationFilterData,
} from "@/app/characters/_utils/character-directory";
import {
  AppliedFilterSummary,
  type AppliedFilterItem,
} from "@/components/filters/applied-filter-summary";
import { FilterBar } from "@/components/filters/filter-bar";
import {
  HierarchicalFilter,
  type FilterTreeNode,
  type HierarchicalFilterSelection,
} from "@/components/filters/hierarchical-filter";
import { ParticipantFilter } from "@/components/filters/participant-filter";
import { TagFilter } from "@/components/filters/tag-filter";
import { DatePicker } from "@/components/ui/date-picker";
import { Select } from "@/components/ui/select";
import type { ClipOptions } from "@/features/clips/clip";
import type {
  CharacterListItem,
  StreamerAffiliation,
} from "@/features/characters/character";
import { getCurrentKstDate } from "@/features/seasons/season-date";
import { clipTagQueries } from "@/queries/clip-tag-queries";
import { useQuery } from "@tanstack/react-query";

interface ClipFiltersProps {
  characters: CharacterListItem[];
  date: string | null;
  day: number | null;
  groups: HierarchicalFilterSelection;
  jobs: HierarchicalFilterSelection;
  options: ClipOptions;
  participantIds: string[];
  tagIds?: string[];
  searchLabel?: string;
  streamerAffiliations: StreamerAffiliation[];
  onDateChange: (date: string | null) => void;
  onDayChange: (day: number | null) => void;
  onGroupsApply: (selection: HierarchicalFilterSelection) => void;
  onJobsApply: (selection: HierarchicalFilterSelection) => void;
  onParticipantsChange: (participantIds: string[]) => void;
  onTagsChange?: (tagIds: string[]) => void;
  onReset: () => void;
}

export function ClipFilters({
  characters,
  date,
  day,
  groups,
  jobs,
  options,
  participantIds,
  tagIds,
  searchLabel = "인물 검색",
  streamerAffiliations,
  onDateChange,
  onDayChange,
  onGroupsApply,
  onJobsApply,
  onParticipantsChange,
  onTagsChange,
  onReset,
}: ClipFiltersProps) {
  const selectedTagsQuery = useQuery(
    clipTagQueries.search("", tagIds ?? []),
  );
  const jobNodes = buildJobAffiliationFilterNodes(characters);
  const groupFilterData = buildStreamerAffiliationFilterData(
    characters,
    streamerAffiliations,
  );
  const selectedParticipants = characters.filter((character) =>
    participantIds.includes(character.id),
  );
  const items: AppliedFilterItem[] = [
    ...(day === null
      ? []
      : [{ id: "day", label: `${day}일차`, onRemove: () => onDayChange(null) }]),
    ...(date === null
      ? []
      : [{ id: "date", label: date, onRemove: () => onDateChange(null) }]),
    ...jobs.ids.map((id) => ({
      id: `job:${id}`,
      label: findFilterLabel(jobNodes, id),
      onRemove: () => onJobsApply({ ids: jobs.ids.filter((value) => value !== id) }),
    })),
    ...groups.ids.map((id) => ({
      id: `group:${id}`,
      label: findFilterLabel(groupFilterData.nodes, id),
      onRemove: () => onGroupsApply({ ids: groups.ids.filter((value) => value !== id) }),
    })),
    ...selectedParticipants.map((character) => ({
      id: `participant:${character.id}`,
      label: character.rpName ?? character.streamerName,
      onRemove: () =>
        onParticipantsChange(
          participantIds.filter((id) => id !== character.id),
        ),
    })),
    ...(selectedTagsQuery.data ?? []).map((tag) => ({
      id: `tag:${tag.id}`,
      label: `#${tag.name}`,
      onRemove: () => onTagsChange?.((tagIds ?? []).filter((id) => id !== tag.id)),
    })),
  ];

  function getResultCount(selection: HierarchicalFilterSelection): number {
    return selection.ids.length;
  }

  return (
    <section aria-label={`${searchLabel} 및 필터`} className="space-y-3">
      <FilterBar>
        <Select
          className="w-44"
          label="봉누도 일차"
          onValueChange={(value) =>
            onDayChange(value === "all" ? null : Number(value))
          }
          options={[
            { label: "일차 전체", value: "all" },
            ...options.seasonDays.map((seasonDay) => ({
              label: `${seasonDay.dayNumber}일차 · ${seasonDay.sessionDate}`,
              value: String(seasonDay.dayNumber),
            })),
          ]}
          value={day === null ? "all" : String(day)}
        />
        <DatePicker
          className="w-44"
          label="날짜"
          max={getCurrentKstDate()}
          onValueChange={onDateChange}
          placeholder="날짜 선택"
          value={date}
        />
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
        <ParticipantFilter
          className="w-52"
          onValueChange={onParticipantsChange}
          value={participantIds}
        />
        {tagIds && onTagsChange ? (
          <TagFilter
            className="w-52"
            onValueChange={onTagsChange}
            value={tagIds}
          />
        ) : null}
      </FilterBar>
      <AppliedFilterSummary items={items} onClearAll={onReset} />
    </section>
  );
}

function findFilterLabel(
  nodes: FilterTreeNode[],
  id: string,
): string {
  for (const node of nodes) {
    if (node.id === id) {
      return node.label;
    }

    if (node.children) {
      const label = findFilterLabel(node.children, id);

      if (label !== id) {
        return label;
      }
    }
  }

  return id;
}
