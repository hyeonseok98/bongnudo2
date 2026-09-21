"use client";

import { useQuery } from "@tanstack/react-query";
import type { KeyboardEvent } from "react";
import { useState } from "react";

import { characterQueries } from "@/queries/character-queries";
import { SearchField } from "@/components/ui/search-field";
import { cn } from "@/utils/cn";
import { matchesKoreanSearch } from "@/utils/korean-search";

interface ParticipantFilterProps {
  className?: string;
  onValueChange: (participantIds: string[]) => void;
  selectionMode?: "multiple" | "single";
  value: string[];
}

export function ParticipantFilter({
  className,
  onValueChange,
  selectionMode = "multiple",
  value,
}: ParticipantFilterProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isSuggestionsDismissed, setIsSuggestionsDismissed] = useState(false);
  const participantQuery = useQuery(characterQueries.list());
  const normalizedQuery = query.trim();
  const matchingParticipants = participantQuery.data?.characters.filter(
    (participant) =>
      matchesKoreanSearch(participant.streamerName, normalizedQuery) ||
      (participant.rpName !== null &&
        matchesKoreanSearch(participant.rpName, normalizedQuery)),
  ) ?? [];
  const isSuggestionOpen = normalizedQuery.length > 0 &&
    !isSuggestionsDismissed &&
    (participantQuery.isPending || participantQuery.data !== undefined);
  const activeParticipant = activeIndex === null
    ? undefined
    : matchingParticipants[activeIndex];

  function handleSelect(participantId: string) {
    if (selectionMode === "single") {
      onValueChange([participantId]);
    } else if (!value.includes(participantId)) {
      onValueChange([...value, participantId]);
    }
    setQuery("");
    setActiveIndex(null);
    setIsSuggestionsDismissed(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape" && isSuggestionOpen) {
      event.preventDefault();
      setActiveIndex(null);
      setIsSuggestionsDismissed(true);
      return;
    }

    if (matchingParticipants.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((currentIndex) =>
        currentIndex === null
          ? 0
          : Math.min(currentIndex + 1, matchingParticipants.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((currentIndex) =>
        currentIndex === null
          ? matchingParticipants.length - 1
          : Math.max(currentIndex - 1, 0),
      );
      return;
    }

    if (event.key === "Enter" && activeParticipant) {
      event.preventDefault();
      handleSelect(activeParticipant.id);
    }
  }

  return (
    <div className={cn("relative", className)}>
      <SearchField
        className="h-10 text-body-sm font-medium"
        aria-activedescendant={activeParticipant ? `participant-suggestion-${activeParticipant.id}` : undefined}
        aria-autocomplete="list"
        aria-controls="participant-suggestions"
        aria-expanded={isSuggestionOpen}
        label="인물 필터 검색"
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(null);
          setIsSuggestionsDismissed(false);
        }}
        onClear={() => {
          setQuery("");
          setActiveIndex(null);
          setIsSuggestionsDismissed(false);
        }}
        onKeyDown={handleKeyDown}
        placeholder="인물 검색"
        role="combobox"
        value={query}
      />
      {isSuggestionOpen ? (
        <div className="absolute z-popover mt-2 max-h-64 w-full overflow-y-auto rounded-lg border border-default bg-surface-raised p-1 shadow-xl sm:w-72" id="participant-suggestions" role="listbox">
          {participantQuery.isPending ? (
            <p className="px-2.5 py-2 text-caption text-secondary">인물을 검색하는 중입니다.</p>
          ) : matchingParticipants.length > 0 ? (
            matchingParticipants.map((participant, index) => (
              <button
                aria-selected={activeIndex === index}
                className={cn(
                  "flex w-full cursor-pointer flex-col rounded-md px-2.5 py-2 text-left transition-colors hover:bg-surface-muted",
                  activeIndex === index && "bg-surface-muted",
                )}
                id={`participant-suggestion-${participant.id}`}
                key={participant.id}
                onClick={() => handleSelect(participant.id)}
                onMouseEnter={() => setActiveIndex(index)}
                role="option"
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
  );
}
