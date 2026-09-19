import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";

interface SelectedJobFilter {
  id: string;
  label: string;
}

export interface SelectedStreamerAffiliationFilter {
  label: string;
  slug: string;
}

interface SelectedFilterSummaryProps {
  selectedJobs: SelectedJobFilter[];
  selectedStreamerAffiliations: SelectedStreamerAffiliationFilter[];
  onClearAll: () => void;
  onRemoveJob: (jobId: string) => void;
  onRemoveStreamerAffiliation: (affiliationSlug: string) => void;
}

export function SelectedFilterSummary({
  selectedJobs,
  selectedStreamerAffiliations,
  onClearAll,
  onRemoveJob,
  onRemoveStreamerAffiliation,
}: SelectedFilterSummaryProps) {
  const hasSelectedFilters =
    selectedJobs.length > 0 || selectedStreamerAffiliations.length > 0;

  if (!hasSelectedFilters) {
    return null;
  }

  return (
    <div className="flex min-h-12 flex-wrap items-center gap-2 border-y border-default py-2">
      <Button onClick={onClearAll} size="sm" variant="ghost">
        <RotateCcw aria-hidden="true" />
        전체 초기화
      </Button>

      {selectedJobs.map((job) => (
        <Chip
          key={job.id}
          mode="removable"
          onRemove={() => onRemoveJob(job.id)}
          removeLabel={job.label + " 필터 제거"}
        >
          {job.label}
        </Chip>
      ))}

      {selectedStreamerAffiliations.map((affiliation) => (
        <Chip
          key={affiliation.slug}
          mode="removable"
          onRemove={() => onRemoveStreamerAffiliation(affiliation.slug)}
          removeLabel={affiliation.label + " 필터 제거"}
        >
          {affiliation.label}
        </Chip>
      ))}
    </div>
  );
}
