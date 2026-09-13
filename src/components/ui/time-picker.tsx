"use client";

import { Popover } from "@base-ui/react/popover";
import { Check, Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/utils/cn";

interface TimePickerProps {
  className?: string;
  isInvalid?: boolean;
  label: string;
  onValueChange: (value: string) => void;
  value: string;
}

const HOURS = Array.from({ length: 24 }, (_, index) => index);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);

export function TimePicker({
  className,
  isInvalid = false,
  label,
  onValueChange,
  value,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hour, minute] = parseTimeValue(value);

  function updateTime(nextHour: number, nextMinute: number): void {
    onValueChange(`${padTimePart(nextHour)}:${padTimePart(nextMinute)}`);
  }

  return (
    <Popover.Root onOpenChange={setIsOpen} open={isOpen}>
      <Popover.Trigger
        aria-invalid={isInvalid || undefined}
        aria-label={label}
        className={cn(
          "flex h-11 w-full min-w-32 cursor-pointer items-center justify-between gap-3 rounded-lg border border-control bg-background px-3 text-body-sm font-medium text-primary outline-none transition-[background-color,border-color] duration-default hover:bg-surface-muted focus-visible:border-focus-ring data-popup-open:border-brand motion-reduce:transition-none",
          className,
        )}
      >
        <span className="whitespace-nowrap tabular-nums">{formatTimeValue(value)}</span>
        <Clock aria-hidden="true" className="size-4 shrink-0 text-tertiary" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          align="end"
          className="z-popover"
          collisionPadding={16}
          sideOffset={6}
        >
          <Popover.Popup className="w-52 rounded-xl border border-default bg-surface-raised p-3 shadow-2xl outline-none transition-[transform,opacity] duration-default data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none">
            <Popover.Title className="sr-only">{label}</Popover.Title>
            <div className="grid grid-cols-2 gap-2">
              <TimeOptionList
                isOpen={isOpen}
                label="시간"
                onSelect={(nextHour) => updateTime(nextHour, minute)}
                selected={hour}
                values={HOURS}
              />
              <TimeOptionList
                isOpen={isOpen}
                label="분"
                onSelect={(nextMinute) => updateTime(hour, nextMinute)}
                selected={minute}
                values={MINUTES}
              />
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function TimeOptionList({
  isOpen,
  label,
  onSelect,
  selected,
  values,
}: {
  isOpen: boolean;
  label: string;
  onSelect: (value: number) => void;
  selected: number;
  values: readonly number[];
}) {
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) selectedRef.current?.scrollIntoView({ block: "center" });
  }, [isOpen]);

  function moveSelection(amount: number): void {
    const index = values.indexOf(selected);
    const nextIndex = (index + amount + values.length) % values.length;
    onSelect(values[nextIndex]);
  }

  return (
    <div>
      <p className="mb-1 text-center text-caption font-semibold text-secondary">
        {label}
      </p>
      <div
        aria-label={label}
        className="h-48 overflow-y-auto rounded-lg bg-surface-inset p-1"
        role="listbox"
      >
        {values.map((option) => {
          const isSelected = option === selected;
          return (
            <button
              aria-selected={isSelected}
              className={cn(
                "relative grid h-9 w-full cursor-pointer place-items-center rounded-md px-2 text-center text-body-sm font-medium tabular-nums text-secondary outline-none hover:bg-surface-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-focus-ring",
                isSelected && "bg-surface-selected text-brand-text",
              )}
              key={option}
              onClick={() => onSelect(option)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  moveSelection(1);
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  moveSelection(-1);
                }
              }}
              ref={isSelected ? selectedRef : undefined}
              role="option"
              tabIndex={isSelected ? 0 : -1}
              type="button"
            >
              {padTimePart(option)}
              {isSelected ? (
                <Check
                  aria-hidden="true"
                  className="absolute right-2 size-3.5"
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function formatTimeValue(value: string): string {
  const [hour, minute] = parseTimeValue(value);
  return `${padTimePart(hour)}:${padTimePart(minute)}`;
}

function parseTimeValue(value: string): [number, number] {
  const match = /^(\d{1,2}):(\d{1,2})$/.exec(value);
  const hour = Number(match?.[1] ?? 0);
  const minute = Number(match?.[2] ?? 0);
  return [
    hour >= 0 && hour <= 23 ? hour : 0,
    minute >= 0 && minute <= 59 ? minute : 0,
  ];
}

function padTimePart(value: number): string {
  return String(value).padStart(2, "0");
}
