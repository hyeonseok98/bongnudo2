"use client";

import { Popover } from "@base-ui/react/popover";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { cn } from "@/utils/cn";

interface DatePickerProps {
  className?: string;
  isInvalid?: boolean;
  label: string;
  max: string;
  onValueChange: (value: string) => void;
  value: string;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function DatePicker({
  className,
  isInvalid = false,
  label,
  max,
  onValueChange,
  value,
}: DatePickerProps) {
  const selectedDate = parseDate(value);
  const maxDate = parseDate(max);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(selectedDate),
  );
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(visibleMonth)),
    end: endOfWeek(endOfMonth(visibleMonth)),
  });
  const nextMonth = addMonths(visibleMonth, 1);
  const focusDate = isSameMonth(selectedDate, visibleMonth)
    ? selectedDate
    : startOfMonth(visibleMonth);

  function selectDate(date: Date): void {
    if (isAfter(date, maxDate)) return;
    onValueChange(format(date, "yyyy-MM-dd"));
    setVisibleMonth(startOfMonth(date));
  }

  function handleDayKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    date: Date,
  ): void {
    const offset =
      event.key === "ArrowLeft"
        ? -1
        : event.key === "ArrowRight"
          ? 1
          : event.key === "ArrowUp"
            ? -7
            : event.key === "ArrowDown"
              ? 7
              : 0;
    if (!offset) return;
    event.preventDefault();
    selectDate(addDays(date, offset));
  }

  return (
    <Popover.Root>
      <Popover.Trigger
        aria-invalid={isInvalid || undefined}
        aria-label={label}
        className={cn(
          "flex h-11 w-full min-w-0 cursor-pointer items-center justify-between gap-3 rounded-lg border border-control bg-background px-3 text-body-sm font-medium text-primary outline-none transition-[background-color,border-color] duration-default hover:bg-surface-muted focus-visible:border-focus-ring data-popup-open:border-brand motion-reduce:transition-none",
          className,
        )}
      >
        <span className="tabular-nums">{value}</span>
        <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-tertiary" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          align="start"
          className="z-popover"
          collisionPadding={16}
          sideOffset={6}
        >
          <Popover.Popup className="w-72 rounded-xl border border-default bg-surface-raised p-3 shadow-2xl outline-none transition-[transform,opacity] duration-default data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none">
            <Popover.Title className="sr-only">{label}</Popover.Title>
            <div className="mb-2 flex items-center justify-between">
              <button
                aria-label="이전 달"
                className="grid size-8 cursor-pointer place-items-center rounded-md text-secondary hover:bg-surface-muted hover:text-primary"
                onClick={() => setVisibleMonth((month) => subMonths(month, 1))}
                type="button"
              >
                <ChevronLeft aria-hidden="true" className="size-4" />
              </button>
              <strong className="text-body-sm font-semibold text-primary">
                {format(visibleMonth, "yyyy년 MM월", { locale: ko })}
              </strong>
              <button
                aria-label="다음 달"
                className="grid size-8 cursor-pointer place-items-center rounded-md text-secondary hover:bg-surface-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
                disabled={isAfter(startOfMonth(nextMonth), startOfMonth(maxDate))}
                onClick={() => setVisibleMonth((month) => addMonths(month, 1))}
                type="button"
              >
                <ChevronRight aria-hidden="true" className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEKDAYS.map((weekday) => (
                <span className="py-1 text-caption font-medium text-tertiary" key={weekday}>
                  {weekday}
                </span>
              ))}
              {days.map((day) => {
                const isSelected = isSameDay(day, selectedDate);
                const isDisabled = isAfter(day, maxDate);
                return (
                  <button
                    aria-current={isSelected ? "date" : undefined}
                    aria-label={format(day, "yyyy년 M월 d일", { locale: ko })}
                    className={cn(
                      "grid size-8 place-items-center rounded-md text-caption font-medium outline-none transition-colors duration-fast focus-visible:outline-2 focus-visible:outline-focus-ring",
                      isSameMonth(day, visibleMonth)
                        ? "text-primary"
                        : "text-tertiary",
                      !isDisabled && "cursor-pointer hover:bg-surface-muted",
                      isSelected && "bg-brand text-brand-foreground hover:bg-brand",
                      isDisabled && "cursor-not-allowed opacity-30",
                    )}
                    disabled={isDisabled}
                    key={day.toISOString()}
                    onClick={() => selectDate(day)}
                    onKeyDown={(event) => handleDayKeyDown(event, day)}
                    tabIndex={isSameDay(day, focusDate) ? 0 : -1}
                    type="button"
                  >
                    {format(day, "d")}
                  </button>
                );
              })}
            </div>
            <button
              className="mt-2 h-8 w-full cursor-pointer rounded-md bg-surface-muted text-caption font-semibold text-primary hover:bg-surface-selected"
              onClick={() => selectDate(maxDate)}
              type="button"
            >
              오늘
            </button>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function parseDate(value: string): Date {
  const date = parseISO(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}
