import { queryOptions } from "@tanstack/react-query";

import { getClipTags, searchClipTags } from "@/apis/clips/get-clip-tags";

export const clipTagQueries = {
  all: () => ["clip-tags"] as const,
  clip: (clipId: string) =>
    queryOptions({
      queryKey: [...clipTagQueries.all(), "clip", clipId] as const,
      queryFn: () => getClipTags(clipId),
    }),
  search: (query: string, ids: string[]) =>
    queryOptions({
      enabled: query.length > 0 || ids.length > 0,
      queryKey: [...clipTagQueries.all(), "search", query, ids] as const,
      queryFn: () => searchClipTags(query, ids),
    }),
};
