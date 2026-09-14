import type { TimelineEvent, TimelineMediaFilter } from "./timeline";
import { matchesEventMediaFilter } from "./timeline-media";

export interface TimelineEventNeighbors {
  next: TimelineEvent | null;
  previous: TimelineEvent | null;
}

export function resolveTimelineEvent(
  pageEvents: TimelineEvent[],
  navigationEvents: TimelineEvent[],
  eventId: string,
): TimelineEvent | null {
  return (
    pageEvents.find((event) => event.id === eventId) ??
    navigationEvents.find((event) => event.id === eventId) ??
    null
  );
}

export function getTimelineEventNeighbors(
  events: TimelineEvent[],
  currentEvent: TimelineEvent,
  mediaFilter: TimelineMediaFilter,
): TimelineEventNeighbors {
  const sortedEvents = events
    .filter(
      (event) =>
        event.id !== currentEvent.id &&
        matchesEventMediaFilter(event, mediaFilter),
    )
    .sort(compareTimelineEvents);
  const earlierEvents = sortedEvents.filter(
    (event) => compareTimelineEvents(event, currentEvent) < 0,
  );
  const laterEvents = sortedEvents.filter(
    (event) => compareTimelineEvents(event, currentEvent) > 0,
  );

  return {
    previous: earlierEvents.at(-1) ?? null,
    next: laterEvents[0] ?? null,
  };
}

export function compareTimelineEvents(
  left: TimelineEvent,
  right: TimelineEvent,
): number {
  return (
    new Date(left.occurredAt).getTime() -
      new Date(right.occurredAt).getTime() ||
    new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime() ||
    left.id.localeCompare(right.id)
  );
}
