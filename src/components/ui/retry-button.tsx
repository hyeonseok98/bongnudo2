import { RotateCw } from "lucide-react";

import { Button } from "./button";

interface RetryButtonProps {
  isPending?: boolean;
  onRetry: () => void;
}

export function RetryButton({ isPending = false, onRetry }: RetryButtonProps) {
  return (
    <Button disabled={isPending} onClick={onRetry} size="sm" type="button" variant="outline">
      <RotateCw aria-hidden="true" className={isPending ? "animate-spin" : undefined} />
      다시 시도
    </Button>
  );
}
