import "server-only";

import type { MetadataRoute } from "next";

import { getSiteOrigin } from "@/features/seo/site-origin";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const SITEMAP_BATCH_SIZE = 1000;
const PUBLIC_STATIC_ROUTES = [
  "/",
  "/live",
  "/characters",
  "/organizations",
  "/clips",
  "/replays",
  "/archives",
  "/privacy",
  "/terms",
];

interface SitemapParticipant {
  id: string;
  rp_name: string | null;
  streamer: { slug: string } | null;
}

interface SitemapOrganization {
  slug: string;
}

interface SitemapArchive {
  id: string;
  updated_at: string;
}

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = getSupabaseAdminClient();
  const seasonResult = await supabase
    .from("seasons")
    .select("id")
    .eq("is_active", true)
    .limit(2);

  if (seasonResult.error || seasonResult.data.length !== 1) {
    throw new Error("Sitemap에서 현재 시즌을 확인하지 못함.", {
      cause: seasonResult.error ?? undefined,
    });
  }

  const seasonId = seasonResult.data[0].id;
  const [participants, organizations, archives] = await Promise.all([
    getAllSitemapRows<SitemapParticipant>(async (from, to) =>
      await supabase
        .from("season_participants")
        .select("id, rp_name, streamer:streamers!inner(slug)")
        .eq("season_id", seasonId)
        .order("id", { ascending: true })
        .range(from, to),
    ),
    getAllSitemapRows<SitemapOrganization>(async (from, to) =>
      await supabase
        .from("organizations")
        .select("slug")
        .eq("season_id", seasonId)
        .order("slug", { ascending: true })
        .range(from, to),
    ),
    getAllSitemapRows<SitemapArchive>(async (from, to) =>
      await supabase
        .from("archives")
        .select("id, updated_at")
        .in("archive_kind", ["user", "system_character"])
        .eq("visibility", "public")
        .is("deleted_at", null)
        .order("id", { ascending: true })
        .range(from, to),
    ),
  ]);

  const siteOrigin = getSiteOrigin();
  const sitemapEntries = new Map<string, MetadataRoute.Sitemap[number]>();

  for (const route of PUBLIC_STATIC_ROUTES) {
    sitemapEntries.set(route, { url: `${siteOrigin}${route}` });
  }

  const streamerSlugs = new Set<string>();

  for (const participant of participants) {
    if (participant.streamer) {
      streamerSlugs.add(participant.streamer.slug);
    }

    if (participant.rp_name) {
      const route = `/characters/rp/${encodeURIComponent(participant.id)}`;
      sitemapEntries.set(route, { url: `${siteOrigin}${route}` });
    }
  }

  for (const slug of streamerSlugs) {
    const route = `/characters/streamer/${encodeURIComponent(slug)}`;
    sitemapEntries.set(route, { url: `${siteOrigin}${route}` });
  }

  for (const organization of organizations) {
    const route = `/organizations/${encodeURIComponent(organization.slug)}`;
    sitemapEntries.set(route, { url: `${siteOrigin}${route}` });
  }

  for (const archive of archives) {
    const route = `/archives/${encodeURIComponent(archive.id)}`;
    sitemapEntries.set(route, {
      url: `${siteOrigin}${route}`,
      lastModified: archive.updated_at,
    });
  }

  return [...sitemapEntries.values()];
}

async function getAllSitemapRows<Row>(
  readPage: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: Row[] | null; error: { message: string } | null }>,
): Promise<Row[]> {
  const rows: Row[] = [];

  for (let from = 0; ; from += SITEMAP_BATCH_SIZE) {
    const result = await readPage(from, from + SITEMAP_BATCH_SIZE - 1);

    if (result.error) {
      throw new Error("Sitemap 데이터를 불러오지 못함.", {
        cause: result.error,
      });
    }

    const page = result.data ?? [];
    rows.push(...page);

    if (page.length < SITEMAP_BATCH_SIZE) {
      return rows;
    }
  }
}
