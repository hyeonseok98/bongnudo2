"use client";

import { ClipFilters } from "@/app/clips/_components/clip-filters";
import type { HierarchicalFilterSelection } from "@/components/filters/hierarchical-filter";
import type {
  CharacterListItem,
  StreamerAffiliation,
} from "@/features/characters/character";
import type { ReplayOptions } from "@/features/replays/replay";

interface ReplayFiltersProps {
  characters: CharacterListItem[];
  date: string | null;
  day: number | null;
  groups: HierarchicalFilterSelection;
  jobs: HierarchicalFilterSelection;
  options: ReplayOptions;
  participantIds: string[];
  streamerAffiliations: StreamerAffiliation[];
  onDateChange: (date: string | null) => void;
  onDayChange: (day: number | null) => void;
  onGroupsApply: (selection: HierarchicalFilterSelection) => void;
  onJobsApply: (selection: HierarchicalFilterSelection) => void;
  onParticipantsChange: (participantIds: string[]) => void;
  onReset: () => void;
}

export function ReplayFilters(props: ReplayFiltersProps) {
  return <ClipFilters {...props} searchLabel="다시보기 검색" />;
}
