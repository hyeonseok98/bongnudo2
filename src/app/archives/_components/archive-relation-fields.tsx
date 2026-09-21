"use client";

import { Popover } from "@base-ui/react/popover";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { Chip } from "@/components/ui/chip";
import { SearchField } from "@/components/ui/search-field";
import type {
  ArchiveEditorOptions,
  ArchiveRelatedParticipant,
} from "@/features/archives/archive";
import { archiveQueries } from "@/queries/archive-queries";
import { cn } from "@/utils/cn";

interface ArchiveRelationFieldsProps {
  onParticipantsChange: (participants: ArchiveRelatedParticipant[]) => void;
  onSeasonDayIdsChange: (seasonDayIds: string[]) => void;
  participants: ArchiveRelatedParticipant[];
  participantError?: string;
  seasonDayError?: string;
  seasonDayIds: string[];
  seasonDays: ArchiveEditorOptions["seasonDays"];
}

export function ArchiveRelationFields({
  onParticipantsChange,
  onSeasonDayIdsChange,
  participants,
  participantError,
  seasonDayError,
  seasonDayIds,
  seasonDays,
}: ArchiveRelationFieldsProps) {
  const [participantQuery, setParticipantQuery] = useState("");
  const normalizedParticipantQuery = participantQuery.trim();
  const participantSearch = useQuery(
    archiveQueries.participantSearch(normalizedParticipantQuery),
  );

  function toggleSeasonDay(seasonDayId: string) {
    onSeasonDayIdsChange(
      seasonDayIds.includes(seasonDayId)
        ? seasonDayIds.filter((id) => id !== seasonDayId)
        : [...seasonDayIds, seasonDayId],
    );
  }

  function addParticipant(participant: ArchiveRelatedParticipant) {
    if (!participants.some((selected) => selected.id === participant.id)) {
      onParticipantsChange([...participants, participant]);
    }
    setParticipantQuery("");
  }

  return (
    <>
      <div className="space-y-2">
        <span className="block text-body-sm font-medium text-primary">관련 일차</span>
        <Popover.Root>
          <Popover.Trigger
            aria-label="관련 일차 선택"
            className="inline-flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-default bg-background px-3 text-body-sm font-medium text-primary outline-none hover:bg-surface-muted focus-visible:border-focus-ring sm:w-64"
          >
            <span>{seasonDayIds.length > 0 ? `${seasonDayIds.length}개 일차 선택` : "관련 일차 선택"}</span>
            <ChevronDown aria-hidden="true" className="size-4 text-tertiary" />
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner
              align="start"
              className="z-popover"
              collisionPadding={16}
              positionMethod="fixed"
              sideOffset={8}
            >
              <Popover.Popup className="w-72 rounded-lg border border-default bg-surface-raised p-1 shadow-xl outline-none">
                <Popover.Title className="sr-only">관련 일차 선택</Popover.Title>
                <div className="max-h-72 overflow-y-auto">
                  {seasonDays.map((seasonDay) => {
                    const isSelected = seasonDayIds.includes(seasonDay.id);

                    return (
                      <button
                        aria-pressed={isSelected}
                        className={cn(
                          "flex min-h-9 w-full cursor-pointer items-center rounded-md px-3 text-left text-body-sm font-medium text-secondary outline-none hover:bg-surface-muted hover:text-primary focus-visible:bg-surface-muted focus-visible:text-primary",
                          isSelected && "bg-surface-selected text-primary",
                        )}
                        key={seasonDay.id}
                        onClick={() => toggleSeasonDay(seasonDay.id)}
                        type="button"
                      >
                        {formatSeasonDayLabel(seasonDay.dayNumber, seasonDay.sessionDate)}
                      </button>
                    );
                  })}
                </div>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
        {seasonDayIds.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {seasonDayIds.flatMap((seasonDayId) => {
              const seasonDay = seasonDays.find((item) => item.id === seasonDayId);
              if (!seasonDay) return [];

              return [(
                <Chip
                  key={seasonDay.id}
                  mode="removable"
                  onRemove={() => toggleSeasonDay(seasonDay.id)}
                  removeLabel={`${seasonDay.dayNumber}일차 제거`}
                >
                  {formatSeasonDayLabel(seasonDay.dayNumber, seasonDay.sessionDate)}
                </Chip>
              )];
            })}
          </div>
        ) : null}
        {seasonDayError ? <p className="text-caption text-status-danger">{seasonDayError}</p> : null}
      </div>

      <div className="space-y-2">
        <span className="block text-body-sm font-medium text-primary">관련 인물</span>
        <div className="relative w-full sm:w-80">
          <SearchField
            label="관련 인물 검색"
            onChange={(event) => setParticipantQuery(event.target.value)}
            onClear={() => setParticipantQuery("")}
            placeholder="RP명 또는 스트리머명 검색"
            value={participantQuery}
          />
          {normalizedParticipantQuery ? (
            <div className="absolute z-popover mt-2 max-h-64 w-full overflow-y-auto rounded-lg border border-default bg-surface-raised p-1 shadow-xl">
              {participantSearch.isPending ? (
                <p className="px-3 py-2 text-caption text-secondary">인물을 검색하는 중입니다.</p>
              ) : participantSearch.isError ? (
                <p className="px-3 py-2 text-caption text-status-danger">인물을 검색하지 못했습니다.</p>
              ) : participantSearch.data?.length ? (
                participantSearch.data.map((participant) => (
                  <button
                    className="flex w-full cursor-pointer flex-col rounded-md px-3 py-2 text-left outline-none hover:bg-surface-muted focus-visible:bg-surface-muted"
                    key={participant.seasonParticipantId}
                    onClick={() => addParticipant({
                      id: participant.seasonParticipantId,
                      rpName: participant.rpName,
                      streamerName: participant.streamerName,
                    })}
                    type="button"
                  >
                    <span className="text-body-sm font-medium text-primary">
                      {participant.rpName ?? "RP 정보 없음"}
                    </span>
                    <span className="text-caption text-secondary">{participant.streamerName}</span>
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-caption text-secondary">검색 결과가 없습니다.</p>
              )}
            </div>
          ) : null}
        </div>
        {participants.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {participants.map((participant) => (
              <Chip
                key={participant.id}
                mode="removable"
                onRemove={() => onParticipantsChange(
                  participants.filter((selected) => selected.id !== participant.id),
                )}
                removeLabel={`${participant.rpName ?? participant.streamerName} 제거`}
              >
                {participant.rpName ?? "RP 정보 없음"} · {participant.streamerName}
              </Chip>
            ))}
          </div>
        ) : null}
        {participantError ? <p className="text-caption text-status-danger">{participantError}</p> : null}
      </div>
    </>
  );
}

function formatSeasonDayLabel(dayNumber: number, sessionDate: string): string {
  const [, month, day] = sessionDate.split("-").map(Number);
  return `${dayNumber}일차 · ${month}월 ${day}일`;
}
