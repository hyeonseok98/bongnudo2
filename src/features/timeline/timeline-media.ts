import type {
  TimelineEvent,
  TimelineMedia,
  TimelineMediaFilter,
} from "./timeline";
import { TIMELINE_MEDIA_FILTER_VALUES } from "./timeline";

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

export function getInitialTimelineMediaId(
  event: TimelineEvent,
  mediaFilter: TimelineMediaFilter,
): string | null {
  const orderedMedia = orderTimelineMedia(event.media);

  if (mediaFilter === "all" || mediaFilter === "media") {
    return orderedMedia[0]?.id ?? null;
  }

  return (
    orderedMedia.find((media) =>
      matchesTimelineMediaFilter(media, mediaFilter),
    )?.id ?? null
  );
}

export function matchesEventMediaFilter(
  event: TimelineEvent,
  mediaFilter: TimelineMediaFilter,
): boolean {
  if (mediaFilter === "all") return true;
  if (mediaFilter === "media") return event.media.length > 0;
  return event.media.some((media) =>
    matchesTimelineMediaFilter(media, mediaFilter),
  );
}

export function matchesTimelineMediaFilter(
  media: TimelineMedia,
  mediaFilter: TimelineMediaFilter,
): boolean {
  if (mediaFilter === "all" || mediaFilter === "media") return true;

  return (
    (mediaFilter === "image" && media.mediaType === "image") ||
    (mediaFilter === "clip" && media.mediaType === "chzzk_clip")
  );
}

function getMediaPriority(media: TimelineMedia): number {
  return media.mediaType === "chzzk_clip" ? 0 : 1;
}
