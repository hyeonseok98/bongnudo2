"use client";

import { Popover } from "@base-ui/react/popover";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

import { cn } from "@/utils/cn";

export interface SelectOption<Value extends string = string> {
  label: string;
  value: Value;
}

interface SelectProps<Value extends string> {
  className?: string;
  disabled?: boolean;
  label: string;
  onValueChange: (value: Value) => void;
  options: readonly SelectOption<Value>[];
  value: Value;
}

export function Select<Value extends string>({
  className,
  disabled,
  label,
  onValueChange,
  options,
  value,
}: SelectProps<Value>) {
  const [isOpen, setIsOpen] = useState(false);

  function handleValueChange(nextValue: Value): void {
    onValueChange(nextValue);
    setIsOpen(false);
  }

  return (
    <Popover.Root onOpenChange={setIsOpen} open={isOpen}>
      <Popover.Trigger
        aria-label={label}
        disabled={disabled}
        className={cn(
          "inline-flex h-10 min-w-28 cursor-pointer items-center justify-between gap-2 rounded-lg border border-default bg-background px-3 text-body-sm font-medium text-primary outline-none transition-[background-color,border-color] duration-default hover:bg-surface-muted focus-visible:border-focus-ring data-popup-open:border-brand disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
          className,
        )}
      >
        <span>{options.find((option) => option.value === value)?.label}</span>
        <ChevronDown aria-hidden="true" className="size-4 text-tertiary" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          align="end"
          className="z-popover"
          collisionPadding={16}
          sideOffset={8}
        >
          <Popover.Popup className="min-w-[var(--anchor-width)] overflow-hidden rounded-lg border border-default bg-surface-raised p-1 shadow-xl outline-none transition-[transform,opacity] duration-default data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none">
            <Popover.Title className="sr-only">{label}</Popover.Title>
            <div aria-label={label} role="listbox">
              {options.map((option) => (
                <button
                  aria-selected={option.value === value}
                  className={cn(
                    "flex min-h-9 w-full cursor-pointer items-center gap-2 rounded-md px-2.5 text-left text-body-sm font-medium text-secondary outline-none transition-colors duration-default hover:bg-surface-muted hover:text-primary focus-visible:bg-surface-muted focus-visible:text-primary motion-reduce:transition-none",
                    option.value === value && "text-primary",
                  )}
                  key={option.value}
                  onClick={() => handleValueChange(option.value)}
                  role="option"
                  type="button"
                >
                  <span className="grid size-4 place-items-center text-brand-text">
                    {option.value === value ? (
                      <Check aria-hidden="true" className="size-4" />
                    ) : null}
                  </span>
                  {option.label}
                </button>
              ))}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
