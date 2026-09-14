"use client";

import { CharacterAvatar } from "@/app/characters/_components/character-avatar";
import { Chip } from "@/components/ui/chip";
import type { TimelineEvent } from "@/features/timeline/timeline";

import { formatTimelineDateTime } from "./timeline-date-time";

interface TimelineEventDetailsProps {
  event: TimelineEvent;
  onTagChange: (tagSlug: string) => void;
}

export function TimelineEventDetails({ event, onTagChange }: TimelineEventDetailsProps) {
  const primaryParticipant = event.participants.find(
    (participant) => participant.isPrimary && participant.rpName?.trim(),
  );
  const relatedParticipants = event.participants.filter(
    (participant) => !participant.isPrimary && participant.rpName?.trim(),
  );

  return (
    <section className="max-h-72 shrink-0 overflow-y-auto border-t border-default bg-surface-raised px-4 py-4">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-4">
          <time
            className="block text-body-sm font-medium text-secondary"
            dateTime={event.occurredAt}
          >
            {formatTimelineDateTime(event.occurredAt)}
          </time>
          <p className="whitespace-pre-wrap text-body-sm leading-relaxed text-primary">
            {event.content}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {event.tags.length > 0 ? (
              event.tags.map((tag) => (
                <Chip
                  className="text-caption"
                  isSelected={false}
                  key={tag.slug}
                  onClick={() => onTagChange(tag.slug)}
                >
                  #{tag.name}
                </Chip>
              ))
            ) : (
              <span className="text-caption text-secondary">태그 없음</span>
            )}
          </div>
        </div>
        <div className="space-y-5">
          {primaryParticipant ? (
            <ParticipantSummary participant={primaryParticipant} />
          ) : (
            <p className="text-body-sm text-secondary">연결된 인물 없음</p>
          )}
          {relatedParticipants.length > 0 ? (
            <div className="space-y-2">
              <p className="text-caption font-semibold text-tertiary">관련 인물</p>
              <div className="flex flex-wrap gap-2">
                {relatedParticipants.map((participant) => (
                  <ParticipantChip
                    key={participant.seasonParticipantId}
                    participant={participant}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ParticipantSummary({
  participant,
}: {
  participant: TimelineEvent["participants"][number];
}) {
  const name = participant.rpName?.trim();
  if (!name) return null;

  return (
    <div className="flex items-center gap-2">
      <CharacterAvatar
        className="size-10 rounded-full border border-default"
        name={name}
        profileImageUrl={participant.profileImageUrl}
        sizes="40px"
      />
      <span className="min-w-0">
        <span className="block text-caption font-semibold text-brand-text">
          [대표] 주요 인물
        </span>
        <span className="block truncate text-body-sm font-semibold text-primary">
          {name}
        </span>
      </span>
    </div>
  );
}

function ParticipantChip({
  participant,
}: {
  participant: TimelineEvent["participants"][number];
}) {
  const name = participant.rpName?.trim();
  if (!name) return null;

  return (
    <span className="inline-flex min-w-0 items-center gap-2 rounded-full border border-default bg-surface-muted pr-3 pl-1">
      <CharacterAvatar
        className="size-7 rounded-full"
        name={name}
        profileImageUrl={participant.profileImageUrl}
        sizes="28px"
      />
      <span className="max-w-32 truncate text-caption font-medium text-primary">
        {name}
      </span>
    </span>
  );
}
