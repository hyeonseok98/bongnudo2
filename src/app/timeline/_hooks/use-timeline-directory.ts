"use client";

import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";

import {
  TIMELINE_MEDIA_FILTER_VALUES,
  TIMELINE_SORT_VALUES,
  type TimelineMediaFilter,
  type TimelineQueryFilters,
  type TimelineSort,
} from "@/features/timeline/timeline";
import {
  isKstDate,
  shiftKstDate,
} from "@/features/timeline/timeline-params";

const timelineQueryParsers = {
  affiliation: parseAsString.withDefault(""),
  category: parseAsString.withDefault(""),
  date: parseAsString.withDefault(""),
  event: parseAsString.withDefault(""),
  job: parseAsString.withDefault(""),
  media: parseAsString.withDefault(""),
  mediaType: parseAsStringLiteral(TIMELINE_MEDIA_FILTER_VALUES).withDefault(
    "all",
  ),
  participant: parseAsString.withDefault(""),
  q: parseAsString.withDefault(""),
  report: parseAsString.withDefault(""),
  correction: parseAsString.withDefault(""),
  sort: parseAsStringLiteral(TIMELINE_SORT_VALUES).withDefault("desc"),
  tag: parseAsString.withDefault(""),
};

export interface TimelineDirectory extends TimelineQueryFilters {
  eventId: string;
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
  changeMedia: (mediaId: string) => void;
  changeMediaType: (mediaType: TimelineMediaFilter) => void;
  closeMedia: () => void;
  closeReportIntent: () => void;
  openMedia: (eventId: string, mediaId: string) => void;
  openMediaEvent: (eventId: string, mediaId: string) => void;
  openReport: () => void;
  openCorrection: (eventId: string) => void;
  moveDate: (amount: number) => void;
}

export function useTimelineDirectory(initialDate: string): TimelineDirectory {
  const [params, setParams] = useQueryStates(timelineQueryParsers);
  const date = isKstDate(params.date) ? params.date : initialDate;

  function setFilter(name: keyof typeof timelineQueryParsers, value: string) {
    void setParams({ [name]: value || null }, { history: "replace" });
  }

  return {
    affiliation: params.affiliation,
    category: params.category,
    date,
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
    sort: params.sort,
    tag: params.tag,
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
        { mediaType: value === "all" ? null : value },
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
