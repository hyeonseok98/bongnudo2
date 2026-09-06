import { X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

interface ToggleChipProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  isSelected: boolean;
  mode?: "toggle";
  onClick: () => void;
}

interface RemovableChipProps {
  children: ReactNode;
  className?: string;
  mode: "removable";
  onRemove: () => void;
  removeLabel: string;
}

type ChipProps = ToggleChipProps | RemovableChipProps;

export function Chip(props: ChipProps) {
  if (props.mode === "removable") {
    return (
      <span
        className={cn(
          "inline-flex h-8 items-center gap-1 rounded-lg border border-default bg-surface-muted pr-1.5 pl-2.5 text-body-sm font-medium text-primary",
          props.className,
        )}
      >
        {props.children}
        <button
          aria-label={props.removeLabel}
          className="grid size-5 cursor-pointer place-items-center rounded-sm text-tertiary transition-colors duration-default hover:bg-surface-selected hover:text-primary motion-reduce:transition-none"
          onClick={props.onRemove}
          type="button"
        >
          <X aria-hidden="true" className="size-3.5" />
        </button>
      </span>
    );
  }

  return (
    <button
      aria-pressed={props.isSelected}
      className={cn(
        "h-9 cursor-pointer rounded-lg border px-3 text-body-sm font-medium transition-[background-color,border-color,color] duration-default motion-reduce:transition-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        props.isSelected
          ? "border-default bg-surface-selected text-primary"
          : "border-default bg-background text-secondary hover:bg-surface-muted hover:text-primary",
        props.className,
      )}
      disabled={props.disabled}
      onClick={props.onClick}
      type="button"
    >
      {props.children}
    </button>
  );
}
