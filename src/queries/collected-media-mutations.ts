import { mutationOptions } from "@tanstack/react-query";

import {
  setCollectedMediaExclusion,
  type SetCollectedMediaExclusionInput,
} from "@/apis/collected-media/set-collected-media-exclusion";

export const collectedMediaMutations = {
  setExclusion: () => mutationOptions<void, Error, SetCollectedMediaExclusionInput>({
    mutationFn: setCollectedMediaExclusion,
  }),
};
