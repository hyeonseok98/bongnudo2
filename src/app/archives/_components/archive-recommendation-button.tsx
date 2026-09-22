"use client";

import { Heart } from "lucide-react";

import { useArchiveRecommendation } from "@/features/archives/use-archive-recommendation";
import { cn } from "@/utils/cn";

interface ArchiveRecommendationButtonProps {
  archiveId: string;
  className?: string;
  recommendationCount: number;
  recommended: boolean;
}

export function ArchiveRecommendationButton({
  archiveId,
  className,
  recommendationCount,
  recommended,
}: ArchiveRecommendationButtonProps) {
  const recommendation = useArchiveRecommendation({
    archiveId,
    recommendationCount,
    recommended,
  });
  const label = recommended ? "추천 취소" : "추천";

  return (
    <button
      aria-label={`${label}, 현재 ${recommendationCount}개`}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 text-body-sm font-medium text-secondary transition-colors hover:text-brand-text focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        recommended && "text-brand-text",
        className,
      )}
      disabled={recommendation.isPending}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        recommendation.toggle();
      }}
      type="button"
    >
      <Heart aria-hidden="true" className={cn("size-4", recommended && "fill-current")} />
      <span>{recommendationCount}</span>
    </button>
  );
}
