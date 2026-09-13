import "server-only";

import { z } from "zod";

import { getR2PublicUrl } from "@/lib/r2";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

import type { TimelinePageData, TimelineQueryFilters } from "./timeline";
import { getKstDateRange } from "./timeline-params";

const categorySchema = z.object({
  name: z.string(),
  slug: z.string(),
});

const participantSchema = z.object({
  isPrimary: z.boolean(),
  profileImageKey: z.string().nullable(),
  rpName: z.string().nullable(),
  seasonParticipantId: z.string().uuid(),
  streamerName: z.string(),
});

const tagSchema = z.object({
  name: z.string(),
  slug: z.string(),
});

const mediaSchema = z.discriminatedUnion("mediaType", [
  z.object({
    clipUrl: z.null(),
    id: z.string().uuid(),
    mediaType: z.literal("image"),
    objectKey: z.string(),
  }),
  z.object({
    clipUrl: z.url(),
    id: z.string().uuid(),
    mediaType: z.literal("chzzk_clip"),
    objectKey: z.null(),
  }),
]);

const timelinePageSchema = z.object({
  categories: z.array(categorySchema),
  events: z.array(
    z.object({
      category: categorySchema,
      content: z.string(),
      id: z.string().uuid(),
      media: z.array(mediaSchema),
      occurredAt: z.string().datetime({ offset: true }),
      participants: z.array(participantSchema),
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

export async function getTimelinePage(
  filters: TimelineQueryFilters,
): Promise<TimelinePageData> {
  const { start, end } = getKstDateRange(filters.date);
  const result = await getSupabaseAdminClient().rpc("get_timeline_page", {
    p_filters: {
      affiliation: filters.affiliation || null,
      categorySlug: filters.category || null,
      dateEnd: end,
      dateStart: start,
      job: filters.job || null,
      limit: 200,
      participantId: filters.participant || null,
      search: filters.query || null,
      sort: filters.sort,
      tagSlug: filters.tag || null,
    },
  });

  if (result.error) {
    throw new Error("타임라인을 불러오지 못했습니다.", {
      cause: result.error,
    });
  }

  const page = timelinePageSchema.parse(result.data);

  return {
    ...page,
    events: page.events.map((event) => ({
      ...event,
      participants: event.participants.map(
        ({ profileImageKey, ...participant }) => ({
          ...participant,
          profileImageUrl: getR2PublicUrl(profileImageKey),
        }),
      ),
      media: event.media.map((media) => {
        if (media.mediaType === "chzzk_clip") {
          return {
            id: media.id,
            mediaType: media.mediaType,
            clipUrl: media.clipUrl,
          };
        }

        const imageUrl = getR2PublicUrl(media.objectKey);

        if (!imageUrl) {
          throw new Error("타임라인 이미지 경로가 올바르지 않음.");
        }

        return { id: media.id, mediaType: media.mediaType, imageUrl };
      }),
    })),
  };
}
