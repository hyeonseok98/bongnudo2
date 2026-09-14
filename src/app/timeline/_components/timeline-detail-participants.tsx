"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

import { CharacterAvatar } from "@/app/characters/_components/character-avatar";
import type { TimelineParticipant } from "@/features/timeline/timeline";

const COLLAPSED_PARTICIPANT_COUNT = 3;

export function TimelineDetailParticipants({
  participants,
}: {
  participants: TimelineParticipant[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const namedParticipants = participants
    .filter((participant) => Boolean(participant.rpName?.trim()))
    .sort((first, second) => Number(second.isPrimary) - Number(first.isPrimary));

  if (namedParticipants.length === 0) {
    return <p className="text-body-sm text-secondary">연결된 인물 없음</p>;
  }

  const visibleParticipants = isExpanded
    ? namedParticipants
    : namedParticipants.slice(0, COLLAPSED_PARTICIPANT_COUNT);
  const hiddenCount = namedParticipants.length - visibleParticipants.length;

  return (
    <section className="min-w-0 space-y-2" aria-label="관련 인물">
      <p className="text-caption font-semibold text-tertiary">
        관련 인물 ({namedParticipants.length})
      </p>
      <div
        className={
          isExpanded
            ? "flex flex-wrap items-center gap-2"
            : "grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2"
        }
      >
        <div
          className={
            isExpanded
              ? "contents"
              : "flex min-w-0 items-center gap-2 overflow-hidden"
          }
        >
          {visibleParticipants.map((participant) => {
            const rpName = participant.rpName?.trim();
            if (!rpName) return null;

            return (
              <span
                className={
                  isExpanded
                    ? "inline-flex shrink-0 items-center gap-2 rounded-full border border-default bg-surface-muted py-0.5 pr-3 pl-1"
                    : "inline-flex min-w-0 max-w-40 flex-1 basis-0 items-center gap-2 rounded-full border border-default bg-surface-muted py-0.5 pr-3 pl-1"
                }
                key={participant.seasonParticipantId}
              >
                <CharacterAvatar
                  className="size-7 shrink-0 rounded-full"
                  name={rpName}
                  profileImageUrl={participant.profileImageUrl}
                  sizes="28px"
                />
                <span className="min-w-0 truncate text-caption font-medium text-primary">
                  {participant.isPrimary ? (
                    <strong className="mr-1 text-brand-text">[대표]</strong>
                  ) : null}
                  {rpName}
                </span>
              </span>
            );
          })}
        </div>
        {hiddenCount > 0 ? (
          <button
            aria-expanded={false}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full border border-default bg-surface-muted px-3 py-1.5 text-caption font-semibold text-primary hover:bg-surface-selected focus-visible:outline-2 focus-visible:outline-focus-ring"
            onClick={() => setIsExpanded(true)}
            type="button"
          >
            +{hiddenCount}
            <ChevronDown aria-hidden="true" className="size-3.5" />
          </button>
        ) : isExpanded && namedParticipants.length > COLLAPSED_PARTICIPANT_COUNT ? (
          <button
            aria-expanded={true}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full border border-default bg-surface-muted px-3 py-1.5 text-caption font-semibold text-primary hover:bg-surface-selected focus-visible:outline-2 focus-visible:outline-focus-ring"
            onClick={() => setIsExpanded(false)}
            type="button"
          >
            접기
            <ChevronUp aria-hidden="true" className="size-3.5" />
          </button>
        ) : null}
      </div>
    </section>
  );
}
