import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import type { CharacterGroup } from "@/features/characters/character";

interface SelectedAffiliationFilter {
  label: string;
  isDetail: boolean;
}

interface SelectedFilterSummaryProps {
  affiliationFilter: SelectedAffiliationFilter | null;
  selectedGroups: CharacterGroup[];
  onClearAffiliation: (isDetail: boolean) => void;
  onClearAll: () => void;
  onRemoveGroup: (groupId: string) => void;
}

export function SelectedFilterSummary({
  affiliationFilter,
  selectedGroups,
  onClearAffiliation,
  onClearAll,
  onRemoveGroup,
}: SelectedFilterSummaryProps) {
  const hasSelectedFilters =
    affiliationFilter !== null || selectedGroups.length > 0;

  return (
    <div className="flex min-h-12 flex-wrap items-center gap-2 border-y border-default py-2">
      <Button
        disabled={!hasSelectedFilters}
        onClick={onClearAll}
        size="sm"
        variant="ghost"
      >
        <RotateCcw aria-hidden="true" />
        전체 해제
      </Button>

      <span aria-hidden="true" className="h-5 border-l border-default" />

      {affiliationFilter ? (
        <Chip
          className="border-brand"
          mode="removable"
          onRemove={() => onClearAffiliation(affiliationFilter.isDetail)}
          removeLabel={`${affiliationFilter.label} 필터 제거`}
        >
          {affiliationFilter.label}
        </Chip>
      ) : null}

      {selectedGroups.map((group) => (
        <Chip
          key={group.slug}
          mode="removable"
          onRemove={() => onRemoveGroup(group.slug)}
          removeLabel={`${group.name} 필터 제거`}
        >
          {group.name}
        </Chip>
      ))}
    </div>
  );
}
