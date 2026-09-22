"use client";

import { Button } from "@/components/ui/button";
import { useCollectedMediaExclusion } from "@/features/collected-media/use-collected-media-exclusion";

interface CollectedMediaExclusionButtonProps {
  mediaId: string;
  mediaType: "clip" | "replay";
  variant?: "card" | "menu";
}

export function CollectedMediaExclusionButton({
  mediaId,
  mediaType,
  variant = "card",
}: CollectedMediaExclusionButtonProps) {
  const exclusionMutation = useCollectedMediaExclusion();

  function handleExclude() {
    if (!window.confirm("이 영상을 봉누도2에서 제외하시겠습니까?")) {
      return;
    }

    exclusionMutation.mutate({ excluded: true, mediaId, mediaType });
  }

  return (
    <div className={variant === "menu" ? "space-y-1" : "px-3 pb-3"}>
      <Button
        className={variant === "menu" ? "w-full justify-start" : undefined}
        disabled={exclusionMutation.isPending}
        onClick={handleExclude}
        size="sm"
        type="button"
        variant={variant === "menu" ? "ghost" : "outline"}
      >
        {exclusionMutation.isPending ? "숨기는 중입니다." : "숨기기"}
      </Button>
      {exclusionMutation.isError ? (
        <p className="mt-1 text-caption text-status-danger">{exclusionMutation.error.message}</p>
      ) : null}
    </div>
  );
}
