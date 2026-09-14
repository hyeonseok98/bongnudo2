"use client";

import { Chip } from "@/components/ui/chip";
import type { TimelineEvent } from "@/features/timeline/timeline";

import { formatTimelineDateTime } from "./timeline-date-time";
import { TimelineDetailParticipants } from "./timeline-detail-participants";

interface TimelineEventDetailsProps {
  event: TimelineEvent;
  onTagChange: (tagSlug: string) => void;
}

export function TimelineEventDetails({ event, onTagChange }: TimelineEventDetailsProps) {
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
        <TimelineDetailParticipants participants={event.participants} />
      </div>
    </section>
  );
}
