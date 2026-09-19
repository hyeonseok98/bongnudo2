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
          "inline-flex h-8 items-center gap-1 rounded-lg border border-brand/50 bg-surface-selected pr-1.5 pl-2.5 text-body-sm font-medium text-brand-text",
          props.className,
        )}
      >
        {props.children}
        <button
          aria-label={props.removeLabel}
          className="grid size-5 cursor-pointer place-items-center rounded-sm text-brand-text/75 outline-none transition-colors duration-default hover:bg-brand/15 hover:text-primary focus-visible:bg-brand/15 focus-visible:text-primary focus-visible:ring-2 focus-visible:ring-focus-ring motion-reduce:transition-none"
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
