"use client";

import { Popover } from "@base-ui/react/popover";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

import { CharacterAvatar } from "@/app/characters/_components/character-avatar";
import { SearchField } from "@/components/ui/search-field";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { reportQueries } from "@/queries/report-queries";
import { cn } from "@/utils/cn";

interface ParticipantFilterProps {
  onValueChange: (participantId: string) => void;
  selectedLabel: string | null;
  value: string;
}

export function ParticipantFilter({
  onValueChange,
  selectedLabel,
  value,
}: ParticipantFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query.trim(), 250);
  const participantsQuery = useQuery(
    reportQueries.participantSearch(debouncedQuery),
  );

  function handleSelect(participantId: string) {
    onValueChange(participantId);
    setIsOpen(false);
    setQuery("");
  }

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger
        className={cn(
          "inline-flex h-11 min-w-40 cursor-pointer items-center gap-2 rounded-lg border border-default bg-background px-3 transition-[background-color,border-color] duration-default hover:bg-surface-muted focus-visible:border-focus-ring",
          isOpen && "border-brand",
        )}
      >
        <span className="text-caption font-medium text-tertiary">인물</span>
        <span className="min-w-0 max-w-40 truncate text-body-sm font-semibold text-primary">
          {value ? (selectedLabel ?? "선택된 인물") : "전체"}
        </span>
        <ChevronDown aria-hidden="true" className="ml-auto size-4 text-tertiary" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          align="start"
          className="z-popover"
          collisionPadding={16}
          side="bottom"
          sideOffset={8}
        >
          <Popover.Popup className="w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-default bg-surface-raised shadow-2xl outline-none">
            <Popover.Title className="sr-only">타임라인 인물 선택</Popover.Title>
            <div className="border-b border-default p-3">
              <SearchField
                autoFocus
                label="타임라인 인물 검색"
                onChange={(event) => setQuery(event.target.value)}
                onClear={() => setQuery("")}
                placeholder="RP명 또는 스트리머명 검색"
                value={query}
              />
            </div>

            <div className="max-h-72 overflow-y-auto p-2">
              {!debouncedQuery ? (
                <p className="px-3 py-8 text-center text-body-sm text-secondary">
                  찾을 인물의 이름을 입력해주세요.
                </p>
              ) : participantsQuery.isPending ? (
                <div aria-label="인물을 검색하는 중" className="space-y-2 p-1" role="status">
                  {Array.from({ length: 3 }, (_, index) => (
                    <div className="flex items-center gap-3 px-2 py-1" key={index}>
                      <Skeleton className="size-8 shrink-0 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-36" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : participantsQuery.isError ? (
                <p className="px-3 py-8 text-center text-body-sm text-status-danger" role="alert">
                  인물 검색에 실패했습니다.
                </p>
              ) : participantsQuery.data.length === 0 ? (
                <p className="px-3 py-8 text-center text-body-sm text-secondary">
                  검색 결과가 없습니다.
                </p>
              ) : (
                participantsQuery.data.map((participant) => {
                  const isSelected = participant.seasonParticipantId === value;

                  return (
                    <button
                      aria-pressed={isSelected}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors duration-default hover:bg-surface-muted"
                      key={participant.seasonParticipantId}
                      onClick={() => handleSelect(participant.seasonParticipantId)}
                      type="button"
                    >
                      <CharacterAvatar
                        className="size-8 shrink-0 rounded-full"
                        name={participant.rpName ?? "RP명 없음"}
                        profileImageUrl={participant.profileImageUrl}
                        sizes="32px"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body-sm font-semibold text-primary">
                          {participant.rpName ?? "RP명 없음"}
                        </span>
                        <span className="block truncate text-caption text-secondary">
                          {[participant.organizationName, participant.role]
                            .filter(Boolean)
                            .join(" · ") || "소속 정보 없음"}
                        </span>
                      </span>
                      {isSelected ? (
                        <Check aria-hidden="true" className="size-4 text-brand-text" />
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
