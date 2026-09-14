import "server-only";

import { z } from "zod";

import { getSupabaseAdminClient } from "@/lib/supabase/server";

import type { TimelineSummaryEvent } from "./timeline";

export const HOME_TIMELINE_EVENT_LIMIT = 5;

const timelineSummaryEventSchema: z.ZodType<TimelineSummaryEvent> = z.object({
  category: z.object({ name: z.string(), slug: z.string() }),
  id: z.string().uuid(),
  occurredAt: z.string().datetime({ offset: true }),
  title: z.string(),
});

const latestTimelinePageSchema = z.object({
  events: z.array(timelineSummaryEventSchema),
});

export async function getLatestTimelineEvents(): Promise<TimelineSummaryEvent[]> {
  const result = await getSupabaseAdminClient().rpc("get_timeline_page", {
    p_filters: {
      affiliation: null,
      categorySlug: null,
      dateEnd: new Date().toISOString(),
      dateStart: "1970-01-01T00:00:00.000Z",
      job: null,
      limit: HOME_TIMELINE_EVENT_LIMIT,
      participantId: null,
      search: null,
      sort: "desc",
      tagSlug: null,
    },
  });

  if (result.error) {
    throw new Error("최신 타임라인을 불러오지 못했습니다.", {
      cause: result.error,
    });
  }

  return latestTimelinePageSchema.parse(result.data).events;
}
