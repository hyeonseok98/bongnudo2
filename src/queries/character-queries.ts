import { queryOptions } from "@tanstack/react-query";

import { getCharacters } from "@/apis/characters/get-characters";
import { getCharacterCareerEvents } from "@/apis/characters/get-character-career-events";

const METADATA_STALE_TIME = 5 * 60 * 1_000;

export const characterQueries = {
  all: () => ["characters"] as const,
  list: () =>
    queryOptions({
      queryKey: [...characterQueries.all(), "list"] as const,
      queryFn: getCharacters,
      staleTime: METADATA_STALE_TIME,
    }),
  careerEvents: (participantId: string) =>
    queryOptions({
      queryKey: [...characterQueries.all(), "career-events", participantId] as const,
      queryFn: () => getCharacterCareerEvents(participantId),
    }),
};
