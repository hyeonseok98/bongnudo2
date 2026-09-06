import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}

export function Select({ children, className, label, ...props }: SelectProps) {
  return (
    <label className="relative inline-flex">
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        className={cn(
          "h-10 cursor-pointer appearance-none rounded-lg border border-default bg-background pr-9 pl-3 text-body-sm font-medium text-primary transition-[background-color,border-color] duration-default outline-none hover:bg-surface-muted focus-visible:border-focus-ring motion-reduce:transition-none",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-tertiary"
      />
    </label>
  );
}
