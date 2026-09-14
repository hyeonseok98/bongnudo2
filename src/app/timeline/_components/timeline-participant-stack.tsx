"use client";

import { Popover } from "@base-ui/react/popover";
import { UsersRound } from "lucide-react";

import { CharacterAvatar } from "@/app/characters/_components/character-avatar";
import type { TimelineParticipant } from "@/features/timeline/timeline";

const VISIBLE_PARTICIPANTS = 3;

interface TimelineParticipantStackProps {
  participants: TimelineParticipant[];
}

export function TimelineParticipantStack({
  participants,
}: TimelineParticipantStackProps) {
  if (participants.length === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-body-sm text-secondary">
        <UsersRound aria-hidden="true" className="size-4" />
        연결된 인물 없음
      </span>
    );
  }

  const visible = participants.slice(0, VISIBLE_PARTICIPANTS);
  const hiddenCount = participants.length - visible.length;

  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={`관련 인물 ${participants.length}명 보기`}
        className="flex w-fit cursor-pointer items-center rounded-full pr-2 hover:bg-surface-selected focus-visible:outline-2 focus-visible:outline-focus-ring"
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        <span className="flex -space-x-2">
          {visible.map((participant) => {
            const name = participant.rpName ?? "RP명 없음";
            return (
              <CharacterAvatar
                className="size-8 rounded-full border-2 border-surface-raised"
                key={participant.seasonParticipantId}
                name={name}
                profileImageUrl={participant.profileImageUrl}
                sizes="32px"
              />
            );
          })}
        </span>
        <span className="ml-2 max-w-24 truncate text-body-sm font-medium text-primary">
          {participants[0]?.rpName ?? "RP명 없음"}
        </span>
        {hiddenCount > 0 ? (
          <span className="ml-1 text-caption text-secondary">
            +{hiddenCount}
          </span>
        ) : null}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          className="z-popover"
          collisionPadding={16}
          sideOffset={8}
        >
          <Popover.Popup
            className="max-h-72 w-64 overflow-y-auto rounded-xl border border-default bg-surface-raised p-2 shadow-xl outline-none"
            onClick={(clickEvent) => clickEvent.stopPropagation()}
          >
            <Popover.Title className="px-2 py-1 text-caption font-semibold text-secondary">
              관련 인물 {participants.length}명
            </Popover.Title>
            <ul className="mt-1 space-y-1">
              {participants.map((participant) => {
                const name = participant.rpName ?? "RP명 없음";
                return (
                  <li
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5"
                    key={participant.seasonParticipantId}
                  >
                    <CharacterAvatar
                      className="size-8 rounded-full"
                      name={name}
                      profileImageUrl={participant.profileImageUrl}
                      sizes="32px"
                    />
                    <span className="min-w-0 truncate text-body-sm font-medium text-primary">
                      {participant.isPrimary ? `[대표] ${name}` : name}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
