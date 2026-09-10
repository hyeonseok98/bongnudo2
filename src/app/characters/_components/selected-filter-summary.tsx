import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";

interface SelectedAffiliationFilter {
  label: string;
}

export interface SelectedStreamerAffiliationFilter {
  label: string;
  slug: string;
}

interface SelectedFilterSummaryProps {
  affiliationFilter: SelectedAffiliationFilter | null;
  selectedStreamerAffiliations: SelectedStreamerAffiliationFilter[];
  streamerAffiliationMode: "include" | "exclude";
  onClearAffiliation: () => void;
  onClearAll: () => void;
  onRemoveStreamerAffiliation: (affiliationSlug: string) => void;
}

export function SelectedFilterSummary({
  affiliationFilter,
  selectedStreamerAffiliations,
  streamerAffiliationMode,
  onClearAffiliation,
  onClearAll,
  onRemoveStreamerAffiliation,
}: SelectedFilterSummaryProps) {
  const hasSelectedFilters =
    affiliationFilter !== null || selectedStreamerAffiliations.length > 0;

  if (!hasSelectedFilters) {
    return null;
  }

  return (
    <div className="flex min-h-12 flex-wrap items-center gap-2 border-y border-default py-2">
      <Button onClick={onClearAll} size="sm" variant="ghost">
        <RotateCcw aria-hidden="true" />
        전체 초기화
      </Button>

      {affiliationFilter ? (
        <Chip
          className="border-brand"
          mode="removable"
          onRemove={onClearAffiliation}
          removeLabel={affiliationFilter.label + " 필터 제거"}
        >
          {affiliationFilter.label}
        </Chip>
      ) : null}

      {selectedStreamerAffiliations.map((affiliation) => (
        <Chip
          key={affiliation.slug}
          mode="removable"
          onRemove={() => onRemoveStreamerAffiliation(affiliation.slug)}
          removeLabel={affiliation.label + " 필터 제거"}
        >
          {streamerAffiliationMode === "exclude" ? "제외: " : ""}
          {affiliation.label}
        </Chip>
      ))}
    </div>
  );
}
