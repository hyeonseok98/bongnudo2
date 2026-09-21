"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/utils/cn";

export interface DateRangeValue {
  from: string;
  to: string;
}

interface DateRangePickerProps {
  className?: string;
  max: string;
  min: string;
  onValueChange: (value: DateRangeValue | null) => void;
  value: DateRangeValue | null;
}

export function DateRangePicker({
  className,
  max,
  min,
  onValueChange,
  value,
}: DateRangePickerProps) {
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);
  const from = pendingFrom ?? value?.from ?? null;

  function handleFromChange(nextFrom: string) {
    setPendingFrom(nextFrom);
    onValueChange(null);
  }

  function handleToChange(nextTo: string) {
    if (from === null || nextTo < from) {
      setPendingFrom(nextTo);
      return;
    }

    setPendingFrom(null);
    onValueChange({ from, to: nextTo });
  }

  function clearRange() {
    setPendingFrom(null);
    onValueChange(null);
  }

  return (
    <div className={cn("flex min-w-0 items-center gap-1", className)}>
      <DatePicker
        className="min-w-0 flex-1"
        label="기간 시작일"
        max={max}
        min={min}
        onValueChange={handleFromChange}
        placeholder="시작일"
        value={from}
      />
      <span aria-hidden="true" className="shrink-0 text-body-sm text-tertiary">~</span>
      <DatePicker
        className="min-w-0 flex-1"
        label="기간 종료일"
        max={max}
        min={from ?? min}
        onValueChange={handleToChange}
        placeholder="종료일"
        value={value?.to ?? null}
      />
      {(from !== null || value !== null) ? (
        <Button aria-label="기간 초기화" className="shrink-0" onClick={clearRange} size="icon-sm" type="button" variant="ghost">
          <X aria-hidden="true" className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
