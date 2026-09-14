import { z } from "zod";

import {
  TIMELINE_SORT_VALUES,
  TIMELINE_VIEW_MODE_VALUES,
  type TimelineQueryFilters,
} from "./timeline";
import { getSeason2OperationalRange } from "./season2-operational-day";

const KST_OFFSET_MILLISECONDS = 9 * 60 * 60 * 1000;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export const TIMELINE_SORT_OPTIONS = [
  { label: "최신순", value: "desc" },
  { label: "오래된순", value: "asc" },
] as const;

const timelineSearchParamsSchema = z.object({
  affiliation: z.string().trim().max(100).catch(""),
  category: z.string().trim().max(100).catch(""),
  date: z.string().refine(isKstDate).catch(""),
  day: z.coerce.number().int().nonnegative().max(1_000).catch(0),
  job: z.string().trim().max(100).catch(""),
  participant: z.string().uuid().or(z.literal("")).catch(""),
  q: z.string().trim().max(100).catch(""),
  scope: z.enum(["page", "season"]).catch("page"),
  sort: z.enum(TIMELINE_SORT_VALUES).catch("desc"),
  tag: z.string().trim().max(100).catch(""),
  view: z.enum(TIMELINE_VIEW_MODE_VALUES).catch("date"),
});

export interface TimelineDateRange {
  end: string;
  start: string;
}

export function getCurrentKstDate(now = new Date()): string {
  return getKstDateFromInstant(now);
}

export function getKstDateFromInstant(instant: Date | string): string {
  return new Date(new Date(instant).getTime() + KST_OFFSET_MILLISECONDS)
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

export function getTimelineDateRange(
  filters: Pick<TimelineQueryFilters, "date" | "day" | "scope" | "viewMode">,
): TimelineDateRange {
  if (filters.scope === "season") {
    const dayZero = getSeason2OperationalRange(0);
    if (!dayZero) throw new Error("0일차 범위를 계산하지 못함.");

    return {
      start: dayZero.start,
      end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  if (filters.viewMode === "date") return getKstDateRange(filters.date);

  const operationalDay = getSeason2OperationalRange(filters.day);
  if (!operationalDay) throw new Error("유효한 운영일이 아님.");
  return { start: operationalDay.start, end: operationalDay.end };
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
    day: searchParams.get("day") ?? "0",
    job: searchParams.get("job") ?? "",
    participant: searchParams.get("participant") ?? "",
    q: searchParams.get("q") ?? "",
    scope: searchParams.get("scope") ?? "page",
    sort: searchParams.get("sort") ?? "desc",
    tag: searchParams.get("tag") ?? "",
    view: searchParams.get("view") ?? "date",
  });

  return {
    affiliation: parsed.affiliation,
    category: parsed.category,
    date: parsed.date || fallbackDate,
    day: parsed.day,
    job: parsed.job,
    participant: parsed.participant,
    query: parsed.q,
    scope: parsed.scope,
    sort: parsed.sort,
    tag: parsed.tag,
    viewMode: parsed.view,
  };
}

export function createTimelineSearchParams(
  filters: TimelineQueryFilters,
): URLSearchParams {
  const searchParams = new URLSearchParams({ date: filters.date });

  if (filters.scope === "season") searchParams.set("scope", "season");

  if (filters.viewMode === "day") {
    searchParams.set("view", "day");
    searchParams.set("day", String(filters.day));
  }

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
