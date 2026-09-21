import { Search, X } from "lucide-react";
import type { InputHTMLAttributes } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";

interface SearchFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
  label: string;
  onClear?: () => void;
}

export function SearchField({
  className,
  containerClassName,
  label,
  onClear,
  role,
  value,
  ...props
}: SearchFieldProps) {
  const hasValue = value !== undefined && String(value).length > 0;

  return (
    <div className={cn("relative", containerClassName)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-tertiary"
      />
      <Input
        {...props}
        aria-label={label}
        autoComplete={props.autoComplete ?? "off"}
        className={cn(onClear ? "pr-11 pl-11" : "pr-4 pl-11", className)}
        role={role ?? "searchbox"}
        type="text"
        value={value}
      />
      {onClear && hasValue ? (
        <button
          aria-label={label + " 지우기"}
          className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-tertiary transition-colors duration-default hover:bg-surface-muted hover:text-primary"
          onClick={onClear}
          type="button"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
