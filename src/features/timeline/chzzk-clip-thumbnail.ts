import "server-only";

import { unstable_cache } from "next/cache";

import { parseChzzkClipUrl } from "@/features/reports/chzzk-clip";

const CHZZK_CLIP_METADATA_REVALIDATE_SECONDS = 60 * 60 * 24;

export const resolveChzzkClipThumbnail = unstable_cache(
  async (clipUrl: string): Promise<string | null> => {
    const clip = parseChzzkClipUrl(clipUrl);
    if (!clip) return null;

    try {
      const response = await fetch(clip.url, {
        headers: {
          // CHZZK returns its public Open Graph metadata to link-preview crawlers.
          "User-Agent":
            "facebookexternalhit/1.1 (+https://www.facebook.com/externalhit_uatext.php)",
        },
        signal: AbortSignal.timeout(5_000),
      });
      if (!response.ok) return null;

      return extractChzzkClipThumbnail(await response.text());
    } catch {
      return null;
    }
  },
  ["chzzk-clip-thumbnail"],
  { revalidate: CHZZK_CLIP_METADATA_REVALIDATE_SECONDS },
);

export function extractChzzkClipThumbnail(html: string): string | null {
  const metaTags = html.match(/<meta\s+[^>]*>/gi) ?? [];

  for (const property of ["og:image", "twitter:image"]) {
    const tag = metaTags.find((candidate) => {
      const key = getMetaAttribute(candidate, "property") ??
        getMetaAttribute(candidate, "name");
      return key?.toLowerCase() === property;
    });
    const content = tag ? getMetaAttribute(tag, "content") : null;
    if (!content) continue;

    try {
      const url = new URL(decodeHtmlAttribute(content));
      if (url.protocol === "https:" || url.protocol === "http:") {
        return url.toString();
      }
    } catch {
      continue;
    }
  }

  return null;
}

function getMetaAttribute(tag: string, attribute: string): string | null {
  const match = tag.match(
    new RegExp(`${attribute}\\s*=\\s*["']([^"']+)["']`, "i"),
  );
  return match?.[1] ?? null;
}

function decodeHtmlAttribute(value: string): string {
  return value.replaceAll("&amp;", "&");
}
