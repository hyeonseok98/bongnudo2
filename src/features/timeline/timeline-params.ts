import { z } from "zod";

import {
  TIMELINE_SORT_VALUES,
  type TimelineQueryFilters,
} from "./timeline";

const KST_OFFSET_MILLISECONDS = 9 * 60 * 60 * 1000;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const timelineSearchParamsSchema = z.object({
  affiliation: z.string().trim().max(100).catch(""),
  category: z.string().trim().max(100).catch(""),
  date: z.string().refine(isKstDate).catch(""),
  job: z.string().trim().max(100).catch(""),
  participant: z.string().uuid().or(z.literal("")).catch(""),
  q: z.string().trim().max(100).catch(""),
  sort: z.enum(TIMELINE_SORT_VALUES).catch("desc"),
  tag: z.string().trim().max(100).catch(""),
});

export interface TimelineDateRange {
  end: string;
  start: string;
}

export function getCurrentKstDate(now = new Date()): string {
  return new Date(now.getTime() + KST_OFFSET_MILLISECONDS)
    .toISOString()
    .slice(0, 10);
}

export function isKstDate(value: string): boolean {
  const match = DATE_PATTERN.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function getKstDateRange(date: string): TimelineDateRange {
  if (!isKstDate(date)) {
    throw new Error("유효한 날짜가 아님.");
  }

  const [year, month, day] = date.split("-").map(Number);
  const startMilliseconds =
    Date.UTC(year, month - 1, day) - KST_OFFSET_MILLISECONDS;

  return {
    start: new Date(startMilliseconds).toISOString(),
    end: new Date(startMilliseconds + 24 * 60 * 60 * 1000).toISOString(),
  };
}

export function shiftKstDate(date: string, amount: number): string {
  if (!isKstDate(date)) {
    throw new Error("유효한 날짜가 아님.");
  }

  const [year, month, day] = date.split("-").map(Number);
  const shiftedDate = new Date(Date.UTC(year, month - 1, day + amount));

  return shiftedDate.toISOString().slice(0, 10);
}

export function parseTimelineSearchParams(
  searchParams: URLSearchParams,
  fallbackDate = getCurrentKstDate(),
): TimelineQueryFilters {
  const parsed = timelineSearchParamsSchema.parse({
    affiliation: searchParams.get("affiliation") ?? "",
    category: searchParams.get("category") ?? "",
    date: searchParams.get("date") ?? "",
    job: searchParams.get("job") ?? "",
    participant: searchParams.get("participant") ?? "",
    q: searchParams.get("q") ?? "",
    sort: searchParams.get("sort") ?? "desc",
    tag: searchParams.get("tag") ?? "",
  });

  return {
    affiliation: parsed.affiliation,
    category: parsed.category,
    date: parsed.date || fallbackDate,
    job: parsed.job,
    participant: parsed.participant,
    query: parsed.q,
    sort: parsed.sort,
    tag: parsed.tag,
  };
}

export function createTimelineSearchParams(
  filters: TimelineQueryFilters,
): URLSearchParams {
  const searchParams = new URLSearchParams({ date: filters.date });

  if (filters.query) searchParams.set("q", filters.query);
  if (filters.category) searchParams.set("category", filters.category);
  if (filters.job) searchParams.set("job", filters.job);
  if (filters.affiliation) {
    searchParams.set("affiliation", filters.affiliation);
  }
  if (filters.participant) {
    searchParams.set("participant", filters.participant);
  }
  if (filters.tag) searchParams.set("tag", filters.tag);
  if (filters.sort !== "desc") searchParams.set("sort", filters.sort);

  return searchParams;
}

export function hasTimelineFilters(filters: TimelineQueryFilters): boolean {
  return Boolean(
    filters.query ||
      filters.category ||
      filters.job ||
      filters.affiliation ||
      filters.participant ||
      filters.tag,
  );
}
