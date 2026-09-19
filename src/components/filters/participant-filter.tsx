"use client";

import { useQuery } from "@tanstack/react-query";
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
  const participantQuery = useQuery(characterQueries.list());
  const normalizedQuery = query.trim();
  const matchingParticipants = participantQuery.data?.characters.filter(
    (participant) =>
      matchesKoreanSearch(participant.streamerName, normalizedQuery) ||
      (participant.rpName !== null &&
        matchesKoreanSearch(participant.rpName, normalizedQuery)),
  ) ?? [];

  function handleSelect(participantId: string) {
    if (selectionMode === "single") {
      onValueChange([participantId]);
    } else if (!value.includes(participantId)) {
      onValueChange([...value, participantId]);
    }
    setQuery("");
  }

  return (
    <div className={cn("relative", className)}>
      <SearchField
        className="h-10 text-body-sm font-medium"
        label="인물 필터 검색"
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery("")}
        placeholder="인물 검색"
        value={query}
      />
      {query && (participantQuery.isPending || participantQuery.data) ? (
        <div className="absolute z-popover mt-2 max-h-64 w-full overflow-y-auto rounded-lg border border-default bg-surface-raised p-1 shadow-xl sm:w-72">
          {participantQuery.isPending ? (
            <p className="px-2.5 py-2 text-caption text-secondary">인물을 검색하는 중입니다.</p>
          ) : matchingParticipants.length > 0 ? (
            matchingParticipants.map((participant) => (
              <button
                className="flex w-full cursor-pointer flex-col rounded-md px-2.5 py-2 text-left transition-colors hover:bg-surface-muted"
                key={participant.id}
                onClick={() => handleSelect(participant.id)}
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
