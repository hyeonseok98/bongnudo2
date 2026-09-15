"use client";

import { useQuery } from "@tanstack/react-query";

import { characterQueries } from "@/queries/character-queries";

export function useCharacterCareerEvents(participantId: string) {
  return useQuery(characterQueries.careerEvents(participantId));
}
