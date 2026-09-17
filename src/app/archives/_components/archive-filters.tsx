"use client";

import {
  AppliedFilterSummary,
  type AppliedFilterItem,
} from "@/components/filters/applied-filter-summary";
import { FilterBar } from "@/components/filters/filter-bar";
import { ParticipantFilter } from "@/components/filters/participant-filter";
import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/ui/search-field";
import { Select } from "@/components/ui/select";
import type { CharacterListItem } from "@/features/characters/character";
import type {
  ArchiveCategory,
  ArchiveListSort,
  ArchiveListType,
  ArchiveStatus,
} from "@/features/archives/archive";

interface ArchiveFiltersProps {
  category: ArchiveCategory | null;
  characters: CharacterListItem[];
  participantId: string | null;
  searchInput: string;
  sort: ArchiveListSort;
  status: ArchiveStatus | null;
  type: ArchiveListType;
  onCategoryChange: (category: ArchiveCategory | null) => void;
  onParticipantChange: (participantId: string | null) => void;
  onReset: () => void;
  onSearchInputChange: (query: string) => void;
  onSortChange: (sort: ArchiveListSort) => void;
  onStatusChange: (status: ArchiveStatus | null) => void;
  onTypeChange: (type: ArchiveListType) => void;
}

const archiveTypes: Array<{ label: string; value: ArchiveListType }> = [
  { label: "전체", value: "all" },
  { label: "자동 인물", value: "system" },
  { label: "사용자 제작", value: "user" },
];

export function ArchiveFilters({
  category,
  characters,
  participantId,
  searchInput,
  sort,
  status,
  type,
  onCategoryChange,
  onParticipantChange,
  onReset,
  onSearchInputChange,
  onSortChange,
  onStatusChange,
  onTypeChange,
}: ArchiveFiltersProps) {
  const selectedParticipant = characters.find(
    (character) => character.id === participantId,
  );
  const items: AppliedFilterItem[] = [
    ...(selectedParticipant
      ? [{
          id: `participant:${selectedParticipant.id}`,
          label: selectedParticipant.rpName ?? selectedParticipant.streamerName,
          onRemove: () => onParticipantChange(null),
        }]
      : []),
    ...(category
      ? [{ id: "category", label: category, onRemove: () => onCategoryChange(null) }]
      : []),
    ...(status
      ? [{ id: "status", label: status === "ongoing" ? "진행 중" : "완료", onRemove: () => onStatusChange(null) }]
      : []),
  ];

  return (
    <section aria-label="아카이브 검색 및 필터" className="space-y-3">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="아카이브 종류">
        {archiveTypes.map((archiveType) => (
          <Button
            aria-selected={type === archiveType.value}
            key={archiveType.value}
            onClick={() => onTypeChange(archiveType.value)}
            size="sm"
            type="button"
            variant={type === archiveType.value ? "default" : "outline"}
          >
            {archiveType.label}
          </Button>
        ))}
      </div>

      <SearchField
        label="아카이브 검색"
        onChange={(event) => onSearchInputChange(event.target.value)}
        onClear={() => onSearchInputChange("")}
        placeholder="아카이브 또는 인물 이름으로 검색해보세요"
        value={searchInput}
      />

      <FilterBar>
        <ParticipantFilter
          className="w-52"
          onValueChange={(participantIds) =>
            onParticipantChange(participantIds[0] ?? null)
          }
          selectionMode="single"
          value={participantId ? [participantId] : []}
        />

        {type === "user" ? (
          <>
            <Select
              label="아카이브 분류"
              onValueChange={(value) => onCategoryChange(value === "all" ? null : value)}
              options={[
                { label: "분류 전체", value: "all" },
                { label: "인물", value: "character" },
                { label: "사건", value: "incident" },
                { label: "시리즈", value: "series" },
                { label: "기타", value: "other" },
              ]}
              value={category ?? "all"}
            />
            <Select
              label="진행 상태"
              onValueChange={(value) => onStatusChange(value === "all" ? null : value)}
              options={[
                { label: "상태 전체", value: "all" },
                { label: "진행 중", value: "ongoing" },
                { label: "완료", value: "completed" },
              ]}
              value={status ?? "all"}
            />
          </>
        ) : null}

        <Select
          label="정렬"
          onValueChange={onSortChange}
          options={[
            { label: "최신 업데이트순", value: "updated" },
            { label: "최근 공개순", value: "published" },
          ]}
          value={sort}
        />
        <Button onClick={onReset} size="sm" type="button" variant="ghost">
          필터 초기화
        </Button>
      </FilterBar>
      <AppliedFilterSummary items={items} onClearAll={onReset} />
    </section>
  );
}
