import { ChevronDown } from "lucide-react";

import { cn } from "@/utils/cn";

export interface FilterSelectOption {
  label: string;
  value: string;
}

interface FilterSelectProps {
  disabled?: boolean;
  label: string;
  onValueChange: (value: string) => void;
  options: readonly FilterSelectOption[];
  value: string;
}

export function FilterSelect({
  disabled,
  label,
  onValueChange,
  options,
  value,
}: FilterSelectProps) {
  return (
    <label
      className={cn(
        "relative inline-flex h-11 min-w-36 items-center rounded-lg border border-default bg-background transition-[background-color,border-color] duration-default hover:bg-surface-muted focus-within:border-focus-ring",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <span className="pointer-events-none pl-3 text-caption font-medium text-tertiary">
        {label}
      </span>
      <select
        aria-label={label + " 필터"}
        className="h-full min-w-0 flex-1 cursor-pointer appearance-none bg-transparent pr-9 pl-2 text-body-sm font-semibold text-primary outline-none"
        disabled={disabled}
        onChange={(event) => onValueChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option
            className="bg-background text-primary"
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 size-4 text-tertiary" />
    </label>
  );
}
