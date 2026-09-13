"use client";

import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";

import {
  TIMELINE_SORT_VALUES,
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
  job: parseAsString.withDefault(""),
  participant: parseAsString.withDefault(""),
  q: parseAsString.withDefault(""),
  sort: parseAsStringLiteral(TIMELINE_SORT_VALUES).withDefault("desc"),
  tag: parseAsString.withDefault(""),
};

export interface TimelineDirectory extends TimelineQueryFilters {
  changeAffiliation: (affiliation: string) => void;
  changeCategory: (category: string) => void;
  changeDate: (date: string) => void;
  changeJob: (job: string) => void;
  changeParticipant: (participant: string) => void;
  changeQuery: (query: string) => void;
  changeSort: (sort: TimelineSort) => void;
  changeTag: (tag: string) => void;
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
    job: params.job,
    participant: params.participant,
    query: params.q,
    sort: params.sort,
    tag: params.tag,
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
    moveDate: (amount) => setFilter("date", shiftKstDate(date, amount)),
  };
}
