"use client";

import { useQuery } from "@tanstack/react-query";
import { useId, useState, type KeyboardEvent } from "react";

import type { ArchiveParticipantSearchResult } from "@/apis/archives/get-archives";
import { SearchField } from "@/components/ui/search-field";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { archiveQueries } from "@/queries/archive-queries";
import { cn } from "@/utils/cn";

interface ArchiveSearchProps {
  value: string;
  onChange: (query: string) => void;
  onParticipantSelect: (participant: ArchiveParticipantSearchResult) => void;
}

export function ArchiveSearch({ value, onChange, onParticipantSelect }: ArchiveSearchProps) {
  const listId = useId();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const query = useDebouncedValue(value.trim(), 300);
  const participantsQuery = useQuery(archiveQueries.participantSearch(query));
  const participants = query === value.trim() ? participantsQuery.data ?? [] : [];
  const isExpanded = isOpen && value.trim().length > 0;
  const active = activeIndex === null ? undefined : participants[activeIndex];

  function selectParticipant(participant: ArchiveParticipantSearchResult) {
    setIsOpen(false);
    setActiveIndex(null);
    onParticipantSelect(participant);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      setActiveIndex(null);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      if (participants.length === 0) return;
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((index) => index === null
        ? (direction === 1 ? 0 : participants.length - 1)
        : (index + direction + participants.length) % participants.length);
    } else if (event.key === "Enter" && isExpanded && active) {
      event.preventDefault();
      selectParticipant(active);
    }
  }

  return (
    <div className="relative max-w-2xl" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
    }}>
      <SearchField
        label="아카이브 통합 검색" placeholder="아카이브 제목, 설명 또는 인물 이름으로 검색해보세요"
        value={value} maxLength={100} role="combobox" aria-autocomplete="list"
        aria-controls={listId} aria-expanded={isExpanded}
        aria-activedescendant={isExpanded && active ? `${listId}-${active.seasonParticipantId}` : undefined}
        onFocus={() => setIsOpen(true)} onKeyDown={handleKeyDown}
        onChange={(event) => { setActiveIndex(null); setIsOpen(true); onChange(event.target.value); }}
        onClear={() => { setActiveIndex(null); setIsOpen(false); onChange(""); }}
      />
      {isExpanded ? (
        <div className="absolute z-popover mt-2 w-full rounded-lg border border-default bg-surface-raised p-1 shadow-xl">
          <p className="px-2.5 py-2 text-body-sm font-medium text-secondary">인물</p>
          <div id={listId} role="listbox" aria-label="관련 인물" className="max-h-64 overflow-y-auto">
            {participants.map((participant, index) => (
              <button type="button" role="option" tabIndex={-1} aria-selected={activeIndex === index}
                key={participant.seasonParticipantId} id={`${listId}-${participant.seasonParticipantId}`}
                className={cn("flex w-full cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-left hover:bg-surface-muted", activeIndex === index && "bg-surface-muted")}
                onMouseEnter={() => setActiveIndex(index)} onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectParticipant(participant)}>
                <span className="text-body-sm font-medium text-primary">{participant.rpName ?? "RP 정보 없음"}</span>
                <span className="text-body-sm text-secondary">{participant.streamerName}</span>
              </button>
            ))}
          </div>
          {participants.length === 0 ? <p className="px-2.5 py-2 text-body-sm text-secondary" role="status">
            {participantsQuery.isError ? "인물을 검색하지 못함." : participantsQuery.isFetching || query !== value.trim() ? "인물을 찾는 중입니다." : "일치하는 인물이 없습니다. 아래에서 아카이브 검색 결과를 확인하세요."}
          </p> : null}
        </div>
      ) : null}
    </div>
  );
}
