import { z } from "zod";

const clipThumbnailSchema = z.object({
  thumbnailUrl: z.url().nullable(),
});

export async function getClipThumbnail(
  clipUrl: string,
): Promise<string | null> {
  const searchParams = new URLSearchParams({ clipUrl });
  const response = await fetch(`/api/timeline/clip-thumbnail?${searchParams}`);

  if (!response.ok) {
    return null;
  }

  return clipThumbnailSchema.parse(await response.json()).thumbnailUrl;
}
