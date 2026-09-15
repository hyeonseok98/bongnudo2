import { queryOptions } from "@tanstack/react-query";

import { getCharacters } from "@/apis/characters/get-characters";
import { getCharacterCareerEvents } from "@/apis/characters/get-character-career-events";

export const characterQueries = {
  all: () => ["characters"] as const,
  list: () =>
    queryOptions({
      queryKey: [...characterQueries.all(), "list"] as const,
      queryFn: getCharacters,
    }),
  careerEvents: (participantId: string) =>
    queryOptions({
      queryKey: [...characterQueries.all(), "career-events", participantId] as const,
      queryFn: () => getCharacterCareerEvents(participantId),
    }),
};
