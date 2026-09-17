import { z } from "zod";

const tagSchema = z.object({
  id: z.uuid(),
  name: z.string(),
});

const clipTagSchema = tagSchema.extend({
  canDelete: z.boolean(),
});

const tagSearchResponseSchema = z.object({ tags: z.array(tagSchema) });
const clipTagsResponseSchema = z.object({ tags: z.array(clipTagSchema) });

export interface ClipTagValue {
  canDelete: boolean;
  id: string;
  name: string;
}

export interface ClipTagSearchValue {
  id: string;
  name: string;
}

export async function getClipTags(clipId: string): Promise<ClipTagValue[]> {
  const response = await fetch(`/api/clips/${clipId}/tags`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "클립 태그를 불러오지 못했습니다."));
  }

  return clipTagsResponseSchema.parse(await response.json()).tags;
}

export async function searchClipTags(
  query: string,
  ids: string[] = [],
): Promise<ClipTagSearchValue[]> {
  const searchParams = new URLSearchParams();

  if (query) searchParams.set("query", query);
  if (ids.length > 0) searchParams.set("ids", ids.join(","));

  const response = await fetch(`/api/clip-tags?${searchParams.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "태그를 검색하지 못했습니다."));
  }

  return tagSearchResponseSchema.parse(await response.json()).tags;
}

export async function addClipTag(clipId: string, name: string): Promise<ClipTagValue[]> {
  const response = await fetch(`/api/clips/${clipId}/tags`, {
    body: JSON.stringify({ name }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "태그를 추가하지 못했습니다."));
  }

  return clipTagsResponseSchema.parse(await response.json()).tags;
}

export async function deleteClipTag(clipId: string, tagId: string): Promise<void> {
  const response = await fetch(`/api/clips/${clipId}/tags/${tagId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "클립 태그를 삭제하지 못했습니다."));
  }
}

async function getErrorMessage(response: Response, fallback: string): Promise<string> {
  const result = z.object({ message: z.string() }).safeParse(await response.json());

  return result.success ? result.data.message : fallback;
}
