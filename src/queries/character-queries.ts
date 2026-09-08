import { queryOptions } from "@tanstack/react-query";

import { getCharacters } from "@/apis/characters/get-characters";

export const characterQueries = {
  all: () => ["characters"] as const,
  list: () =>
    queryOptions({
      queryKey: [...characterQueries.all(), "list"] as const,
      queryFn: getCharacters,
    }),
};
