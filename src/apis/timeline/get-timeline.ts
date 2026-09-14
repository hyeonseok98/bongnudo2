import { z } from "zod";

import type {
  TimelinePageData,
  TimelineQueryFilters,
} from "@/features/timeline/timeline";
import { createTimelineSearchParams } from "@/features/timeline/timeline-params";

const categorySchema = z.object({ name: z.string(), slug: z.string() });
const tagSchema = z.object({ name: z.string(), slug: z.string() });

const timelinePageSchema: z.ZodType<TimelinePageData> = z.object({
  categories: z.array(categorySchema),
  events: z.array(
    z.object({
      category: categorySchema,
      content: z.string(),
      createdAt: z.string().datetime({ offset: true }),
      id: z.string().uuid(),
      media: z.array(
        z.discriminatedUnion("mediaType", [
          z.object({
            id: z.string().uuid(),
            imageUrl: z.url(),
            mediaType: z.literal("image"),
          }),
          z.object({
            clipUrl: z.url(),
            id: z.string().uuid(),
            mediaType: z.literal("chzzk_clip"),
            thumbnailUrl: z.url().nullable(),
          }),
        ]),
      ),
      occurredAt: z.string().datetime({ offset: true }),
      participants: z.array(
        z.object({
          isPrimary: z.boolean(),
          profileImageUrl: z.url().nullable(),
          rpName: z.string().nullable(),
          seasonParticipantId: z.string().uuid(),
          streamerName: z.string(),
        }),
      ),
      reportCount: z.number().int().nonnegative(),
      tags: z.array(tagSchema),
      title: z.string(),
    }),
  ),
  isTruncated: z.boolean(),
  popularTags: z.array(
    tagSchema.extend({ usageCount: z.number().int().positive() }),
  ),
  totalCount: z.number().int().nonnegative(),
});

export async function getTimeline(
  filters: TimelineQueryFilters,
): Promise<TimelinePageData> {
  const response = await fetch(
    `/api/timeline?${createTimelineSearchParams(filters)}`,
  );

  if (!response.ok) {
    throw new Error("타임라인을 불러오지 못했습니다.");
  }

  return timelinePageSchema.parse(await response.json());
}
