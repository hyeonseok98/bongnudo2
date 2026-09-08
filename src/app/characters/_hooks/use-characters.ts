"use client";

import { useQuery } from "@tanstack/react-query";

import { characterQueries } from "@/queries/character-queries";

export function useCharacters() {
  return useQuery(characterQueries.list());
}
