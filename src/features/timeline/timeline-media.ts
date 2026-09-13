import type {
  TimelineEvent,
  TimelineMedia,
  TimelineMediaFilter,
} from "./timeline";
import { TIMELINE_MEDIA_FILTER_VALUES } from "./timeline";

export interface TimelineEventNeighbors {
  next: TimelineEvent | null;
  previous: TimelineEvent | null;
}

export function parseTimelineMediaFilter(
  value: string | null | undefined,
): TimelineMediaFilter {
  return TIMELINE_MEDIA_FILTER_VALUES.find(
    (candidate) => candidate === value,
  ) ?? "all";
}

export function getTimelineEventNeighbors(
  events: TimelineEvent[],
  currentEventId: string,
  mediaFilter: TimelineMediaFilter,
): TimelineEventNeighbors {
  const currentEvent = events.find((event) => event.id === currentEventId);

  if (!currentEvent) {
    return { next: null, previous: null };
  }

  const sortedEvents = events
    .filter(
      (event) =>
        event.id !== currentEventId &&
        event.media.some((media) => matchesMediaFilter(media, mediaFilter)),
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

export function getInitialTimelineMediaId(
  event: TimelineEvent,
  mediaFilter: TimelineMediaFilter,
): string | null {
  return (
    event.media.find((media) => matchesMediaFilter(media, mediaFilter))?.id ??
    event.media[0]?.id ??
    null
  );
}

function matchesMediaFilter(
  media: TimelineMedia,
  mediaFilter: TimelineMediaFilter,
): boolean {
  return (
    mediaFilter === "all" ||
    (mediaFilter === "image" && media.mediaType === "image") ||
    (mediaFilter === "clip" && media.mediaType === "chzzk_clip")
  );
}

function compareTimelineEvents(
  left: TimelineEvent,
  right: TimelineEvent,
): number {
  return (
    new Date(left.occurredAt).getTime() -
      new Date(right.occurredAt).getTime() ||
    left.id.localeCompare(right.id)
  );
}
