import Link from "next/link";

import type { CharacterDirectoryMode } from "@/constants/character-list";
import { cn } from "@/utils/cn";

interface CharacterModeSwitchProps {
  mode: CharacterDirectoryMode;
  onModeChange?: (mode: CharacterDirectoryMode) => void;
  streamerHref?: string;
  rpHref?: string;
  isRpAvailable?: boolean;
  variant?: "directory" | "detail";
}

const MODE_OPTIONS = [
  { value: "streamer", label: "스트리머 도감" },
  { value: "rp", label: "RP 도감" },
] as const;

export function CharacterModeSwitch({
  mode,
  onModeChange,
  streamerHref = "/characters",
  rpHref = "/characters?mode=rp",
  isRpAvailable = true,
  variant = "directory",
}: CharacterModeSwitchProps) {
  const isDetail = variant === "detail";

  return (
    <div
      aria-label="인물 도감 모드"
      className={cn(
        "inline-grid shrink-0 grid-cols-2 overflow-hidden backdrop-blur-md",
        isDetail
          ? "w-full rounded-xl border border-control bg-black/70 shadow-sm"
          : "rounded-xl border border-brand/35 bg-background/90 p-1 shadow-lg",
      )}
      role="group"
    >
      {MODE_OPTIONS.map((option) => {
        const isDisabled = option.value === "rp" && !isRpAvailable;
        const className = cn(
          "inline-flex cursor-pointer items-center justify-center border border-transparent px-5 text-body-sm font-semibold transition-[background-color,border-color,color,box-shadow] duration-default",
          isDetail ? "h-12" : "h-10",
          isDetail && "first:border-r-control",
          !isDetail && "rounded-lg",
          mode === option.value && isDetail
            ? "border-brand/55 bg-brand/10 text-brand-text shadow-[inset_0_0_18px_rgba(30,210,120,0.08)]"
            : mode === option.value
              ? "border-brand/70 bg-brand/20 text-brand-text shadow-sm"
              : isDetail
                ? "text-secondary hover:border-brand/25 hover:text-brand-text"
                : "text-secondary hover:border-brand/30 hover:bg-brand/10 hover:text-brand-text",
          isDisabled &&
            "cursor-not-allowed border-transparent bg-transparent text-tertiary opacity-55 shadow-none hover:border-transparent hover:bg-transparent hover:text-tertiary",
        );

        if (isDisabled) {
          return (
            <button
              className={className}
              disabled
              key={option.value}
              type="button"
            >
              {option.label}
            </button>
          );
        }

        return onModeChange ? (
          <button
            aria-pressed={mode === option.value}
            className={className}
            key={option.value}
            type="button"
            onClick={() => onModeChange(option.value)}
          >
            {option.label}
          </button>
        ) : (
          <Link
            aria-current={mode === option.value ? "page" : undefined}
            className={className}
            href={option.value === "streamer" ? streamerHref : rpHref}
            key={option.value}
            replace={isDetail}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
