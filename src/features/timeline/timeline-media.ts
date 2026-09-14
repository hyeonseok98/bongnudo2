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
  ) ?? "media";
}

export function orderTimelineMedia(media: TimelineMedia[]): TimelineMedia[] {
  return media
    .map((item, index) => ({ index, item }))
    .sort(
      (left, right) =>
        getMediaPriority(left.item) - getMediaPriority(right.item) ||
        left.index - right.index,
    )
    .map(({ item }) => item);
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

export function getInitialTimelineMediaId(
  event: TimelineEvent,
  mediaFilter: TimelineMediaFilter,
): string | null {
  const orderedMedia = orderTimelineMedia(event.media);

  if (mediaFilter === "all" || mediaFilter === "media") {
    return orderedMedia[0]?.id ?? null;
  }

  return (
    orderedMedia.find((media) => matchesMediaFilter(media, mediaFilter))?.id ?? null
  );
}

export function matchesEventMediaFilter(
  event: TimelineEvent,
  mediaFilter: TimelineMediaFilter,
): boolean {
  if (mediaFilter === "all") return true;
  if (mediaFilter === "media") return event.media.length > 0;
  return event.media.some((media) => matchesMediaFilter(media, mediaFilter));
}

function matchesMediaFilter(
  media: TimelineMedia,
  mediaFilter: TimelineMediaFilter,
): boolean {
  return (
    (mediaFilter === "image" && media.mediaType === "image") ||
    (mediaFilter === "clip" && media.mediaType === "chzzk_clip")
  );
}

function getMediaPriority(media: TimelineMedia): number {
  return media.mediaType === "chzzk_clip" ? 0 : 1;
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
