import type { HTMLAttributes } from "react";

import { cn } from "@/utils/cn";

type BadgeVariant = "neutral" | "outline";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({
  className,
  variant = "neutral",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-md px-2 text-caption font-medium whitespace-nowrap",
        variant === "neutral"
          ? "bg-surface-muted text-primary"
          : "border border-default text-secondary",
        className,
      )}
      {...props}
    />
  );
}
