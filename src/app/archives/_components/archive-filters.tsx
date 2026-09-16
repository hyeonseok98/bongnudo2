"use client";

import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";

import { FilterBar } from "@/components/filters/filter-bar";
import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/ui/search-field";
import { Select } from "@/components/ui/select";
import type {
  ArchiveCategory,
  ArchiveListSort,
  ArchiveListType,
  ArchiveStatus,
} from "@/features/archives/archive";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { archiveQueries } from "@/queries/archive-queries";

interface ArchiveFiltersProps {
  category: ArchiveCategory | null;
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
  const [participantSearch, setParticipantSearch] = useState("");
  const debouncedParticipantSearch = useDebouncedValue(participantSearch.trim(), 250);
  const participantQuery = useQuery(
    archiveQueries.participantSearch(debouncedParticipantSearch),
  );

  function handleParticipantSelect(participantId: string) {
    onParticipantChange(participantId);
    setParticipantSearch("");
  }

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
        <div className="relative min-w-52 flex-1 sm:flex-none">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-tertiary"
            />
            <input
              aria-label="인물 필터 검색"
              className="h-10 w-full rounded-lg border border-default bg-background pr-9 pl-9 text-body-sm text-primary outline-none transition-[background-color,border-color] duration-default placeholder:text-tertiary focus-visible:border-focus-ring sm:w-56"
              onChange={(event) => setParticipantSearch(event.target.value)}
              placeholder="인물 필터"
              value={participantSearch}
            />
            {participantSearch ? (
              <button
                aria-label="인물 검색어 지우기"
                className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 cursor-pointer place-items-center rounded text-tertiary hover:bg-surface-muted hover:text-primary"
                onClick={() => setParticipantSearch("")}
                type="button"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            ) : null}
          </div>
          {participantSearch && (participantQuery.isPending || participantQuery.data) ? (
            <div className="absolute z-popover mt-2 w-full overflow-hidden rounded-lg border border-default bg-surface-raised p-1 shadow-xl sm:w-72">
              {participantQuery.isPending ? (
                <p className="px-2.5 py-2 text-caption text-secondary">인물을 검색하는 중입니다.</p>
              ) : participantQuery.data?.length ? (
                participantQuery.data.map((participant) => (
                  <button
                    className="flex w-full cursor-pointer flex-col rounded-md px-2.5 py-2 text-left hover:bg-surface-muted"
                    key={participant.seasonParticipantId}
                    onClick={() => handleParticipantSelect(participant.seasonParticipantId)}
                    type="button"
                  >
                    <span className="text-body-sm font-medium text-primary">
                      {participant.rpName ?? "RP 정보 없음"}
                    </span>
                    <span className="text-caption text-secondary">{participant.streamerName}</span>
                  </button>
                ))
              ) : (
                <p className="px-2.5 py-2 text-caption text-secondary">검색 결과가 없습니다.</p>
              )}
            </div>
          ) : null}
        </div>

        {participantId ? (
          <Button
            aria-label="선택한 인물 필터 지우기"
            onClick={() => onParticipantChange(null)}
            size="sm"
            type="button"
            variant="outline"
          >
            인물 필터 적용됨
            <X aria-hidden="true" className="size-3.5" />
          </Button>
        ) : null}

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
    </section>
  );
}
