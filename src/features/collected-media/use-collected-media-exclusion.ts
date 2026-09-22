"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { clipQueries } from "@/queries/clip-queries";
import { collectedMediaMutations } from "@/queries/collected-media-mutations";
import { replayQueries } from "@/queries/replay-queries";

export function useCollectedMediaExclusion() {
  const queryClient = useQueryClient();

  return useMutation({
    ...collectedMediaMutations.setExclusion(),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: input.mediaType === "clip" ? clipQueries.lists() : replayQueries.lists(),
      });
    },
  });
}
