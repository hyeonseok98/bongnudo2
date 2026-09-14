"use client";

import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";

import {
  TIMELINE_MEDIA_FILTER_VALUES,
  TIMELINE_SORT_VALUES,
  type TimelineMediaFilter,
  type TimelineQueryFilters,
  type TimelineSort,
  TIMELINE_VIEW_MODE_VALUES,
  type TimelineViewMode,
} from "@/features/timeline/timeline";
import {
  isKstDate,
  shiftKstDate,
} from "@/features/timeline/timeline-params";

const timelineQueryParsers = {
  affiliation: parseAsString.withDefault(""),
  category: parseAsString.withDefault(""),
  date: parseAsString.withDefault(""),
  day: parseAsInteger.withDefault(1),
  event: parseAsString.withDefault(""),
  job: parseAsString.withDefault(""),
  media: parseAsString.withDefault(""),
  mediaType: parseAsStringLiteral(TIMELINE_MEDIA_FILTER_VALUES).withDefault("media"),
  participant: parseAsString.withDefault(""),
  q: parseAsString.withDefault(""),
  report: parseAsString.withDefault(""),
  correction: parseAsString.withDefault(""),
  sort: parseAsStringLiteral(TIMELINE_SORT_VALUES).withDefault("desc"),
  tag: parseAsString.withDefault(""),
  view: parseAsStringLiteral(TIMELINE_VIEW_MODE_VALUES).withDefault("date"),
};

export interface TimelineDirectory extends TimelineQueryFilters {
  eventId: string;
  changeDay: (day: number) => void;
  mediaId: string;
  mediaType: TimelineMediaFilter;
  reportIntent: "report" | "correction" | null;
  correctionEventId: string;
  applyTagFromMedia: (tag: string) => void;
  changeAffiliation: (affiliation: string) => void;
  changeCategory: (category: string) => void;
  changeDate: (date: string) => void;
  changeJob: (job: string) => void;
  changeParticipant: (participant: string) => void;
  changeQuery: (query: string) => void;
  changeSort: (sort: TimelineSort) => void;
  changeTag: (tag: string) => void;
  changeViewMode: (mode: TimelineViewMode) => void;
  changeMedia: (mediaId: string) => void;
  changeMediaType: (mediaType: TimelineMediaFilter) => void;
  clearFilters: () => void;
  closeMedia: () => void;
  closeReportIntent: () => void;
  openMedia: (eventId: string, mediaId: string) => void;
  openMediaEvent: (eventId: string, mediaId: string) => void;
  openReport: () => void;
  openCorrection: (eventId: string) => void;
  moveDate: (amount: number) => void;
  moveDay: (amount: number) => void;
}

export function useTimelineDirectory(
  initialDate: string,
  initialDay: number,
): TimelineDirectory {
  const [params, setParams] = useQueryStates(timelineQueryParsers);
  const date = isKstDate(params.date) ? params.date : initialDate;

  function setFilter(name: keyof typeof timelineQueryParsers, value: string) {
    void setParams({ [name]: value || null }, { history: "replace" });
  }

  return {
    affiliation: params.affiliation,
    category: params.category,
    date,
    day: params.day > 0 ? params.day : initialDay,
    eventId: params.event,
    job: params.job,
    mediaId: params.media,
    mediaType: params.mediaType,
    reportIntent:
      params.report === "open"
        ? "report"
        : params.correction
          ? "correction"
          : null,
    correctionEventId: params.correction,
    participant: params.participant,
    query: params.q,
    scope: "page",
    sort: params.sort,
    tag: params.tag,
    viewMode: params.view,
    applyTagFromMedia: (value) => {
      void setParams(
        { event: null, media: null, tag: value || null },
        { history: "replace" },
      );
    },
    changeAffiliation: (value) => setFilter("affiliation", value),
    changeCategory: (value) => setFilter("category", value),
    changeDate: (value) => {
      if (isKstDate(value)) setFilter("date", value);
    },
    changeDay: (value) => {
      if (Number.isInteger(value) && value > 0) {
        void setParams({ day: value }, { history: "replace" });
      }
    },
    changeJob: (value) => setFilter("job", value),
    changeParticipant: (value) => setFilter("participant", value),
    changeQuery: (value) => setFilter("q", value),
    changeSort: (value) => {
      void setParams(
        { sort: value === "desc" ? null : value },
        { history: "replace" },
      );
    },
    changeTag: (value) => setFilter("tag", value),
    changeMedia: (value) => {
      void setParams({ media: value || null }, { history: "replace" });
    },
    changeMediaType: (value) => {
      void setParams(
        { mediaType: value === "media" ? null : value },
        { history: "replace" },
      );
    },
    changeViewMode: (value) => {
      void setParams(
        value === "date"
          ? { day: null, view: null }
          : { day: initialDay, view: "day" },
        { history: "replace" },
      );
    },
    clearFilters: () => {
      void setParams(
        {
          affiliation: null,
          category: null,
          job: null,
          participant: null,
          q: null,
          tag: null,
        },
        { history: "replace" },
      );
    },
    closeMedia: () => {
      void setParams({ event: null, media: null }, { history: "replace" });
    },
    closeReportIntent: () => {
      void setParams(
        { correction: null, report: null },
        { history: "replace" },
      );
    },
    moveDate: (amount) => setFilter("date", shiftKstDate(date, amount)),
    moveDay: (amount) => {
      const nextDay = Math.max(1, params.day + amount);
      void setParams({ day: nextDay }, { history: "replace" });
    },
    openMedia: (eventId, mediaId) => {
      void setParams(
        {
          correction: null,
          event: eventId,
          media: mediaId,
          report: null,
        },
        { history: "push" },
      );
    },
    openMediaEvent: (eventId, mediaId) => {
      void setParams(
        { event: eventId, media: mediaId },
        { history: "replace" },
      );
    },
    openReport: () => {
      void setParams(
        { correction: null, event: null, media: null, report: "open" },
        { history: "push" },
      );
    },
    openCorrection: (eventId) => {
      void setParams(
        { correction: eventId, event: null, media: null, report: null },
        { history: "push" },
      );
    },
  };
}
