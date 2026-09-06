import { Search } from "lucide-react";
import type { InputHTMLAttributes } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";

interface SearchFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
  label: string;
}

export function SearchField({
  className,
  containerClassName,
  label,
  ...props
}: SearchFieldProps) {
  return (
    <div className={cn("relative", containerClassName)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-tertiary"
      />
      <Input
        aria-label={label}
        className={cn("pr-4 pl-11", className)}
        type="search"
        {...props}
      />
    </div>
  );
}
