"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

interface CollectedMediaExclusionButtonProps {
  mediaId: string;
  mediaType: "clip" | "replay";
  onExcluded: () => void;
}

export function CollectedMediaExclusionButton({
  mediaId,
  mediaType,
  onExcluded,
}: CollectedMediaExclusionButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleExclude() {
    if (!window.confirm("이 영상을 봉누도2에서 제외하시겠습니까?")) {
      return;
    }

    setIsPending(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/${mediaType}s/${mediaId}/exclusion`, {
        body: JSON.stringify({ excluded: true }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("영상을 제외하지 못했습니다.");
      }

      onExcluded();
    } catch {
      setErrorMessage("영상을 제외하지 못했습니다.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="px-3 pb-3">
      <Button
        disabled={isPending}
        onClick={() => void handleExclude()}
        size="sm"
        type="button"
        variant="outline"
      >
        {isPending ? "제외하는 중입니다." : "봉누도2에서 제외"}
      </Button>
      {errorMessage ? <p className="mt-1 text-caption text-status-danger">{errorMessage}</p> : null}
    </div>
  );
}
