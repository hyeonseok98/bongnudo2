import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";

export interface AppliedFilterItem {
  id: string;
  label: string;
  onRemove: () => void;
}

interface AppliedFilterSummaryProps {
  items: AppliedFilterItem[];
  onClearAll: () => void;
}

export function AppliedFilterSummary({
  items,
  onClearAll,
}: AppliedFilterSummaryProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex min-h-11 flex-wrap items-center gap-2 border-y border-default py-2">
      <Button onClick={onClearAll} size="sm" type="button" variant="ghost">
        <RotateCcw aria-hidden="true" />
        필터 초기화
      </Button>
      {items.map((item) => (
        <Chip
          key={item.id}
          mode="removable"
          onRemove={item.onRemove}
          removeLabel={`${item.label} 필터 제거`}
        >
          {item.label}
        </Chip>
      ))}
    </div>
  );
}
