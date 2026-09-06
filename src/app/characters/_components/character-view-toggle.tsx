import { Grid2X2, List } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CharacterView } from "@/constants/character-list";
import { cn } from "@/utils/cn";

interface CharacterViewToggleProps {
  view: CharacterView;
  onViewChange: (view: CharacterView) => void;
}

export function CharacterViewToggle({
  view,
  onViewChange,
}: CharacterViewToggleProps) {
  return (
    <div
      aria-label="인물 보기 방식"
      className="inline-flex rounded-lg border border-default bg-background p-1"
      role="group"
    >
      <Button
        aria-pressed={view === "grid"}
        className={cn(view === "grid" && "bg-surface-selected text-primary")}
        onClick={() => onViewChange("grid")}
        size="sm"
        variant="ghost"
      >
        <Grid2X2 aria-hidden="true" />
        그리드
      </Button>
      <Button
        aria-pressed={view === "list"}
        className={cn(view === "list" && "bg-surface-selected text-primary")}
        onClick={() => onViewChange("list")}
        size="sm"
        variant="ghost"
      >
        <List aria-hidden="true" />
        리스트
      </Button>
    </div>
  );
}
