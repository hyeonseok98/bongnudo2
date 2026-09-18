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
  ArchiveStatus,
} from "@/features/archives/archive";

interface ArchiveFiltersProps {
  category: ArchiveCategory | null;
  characters: CharacterListItem[];
  participantId: string | null;
  searchInput: string;
  status: ArchiveStatus | null;
  onCategoryChange: (category: ArchiveCategory | null) => void;
  onParticipantChange: (participantId: string | null) => void;
  onReset: () => void;
  onSearchInputChange: (query: string) => void;
  onStatusChange: (status: ArchiveStatus | null) => void;
}

export function ArchiveFilters({
  category,
  characters,
  participantId,
  searchInput,
  status,
  onCategoryChange,
  onParticipantChange,
  onReset,
  onSearchInputChange,
  onStatusChange,
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
        <Button onClick={onReset} size="sm" type="button" variant="ghost">
          필터 초기화
        </Button>
      </FilterBar>
      <AppliedFilterSummary items={items} onClearAll={onReset} />
    </section>
  );
}
