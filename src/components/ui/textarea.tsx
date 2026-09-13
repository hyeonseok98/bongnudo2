import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full resize-none overflow-y-auto rounded-lg border border-control bg-background px-3 py-2.5 text-body-sm text-primary outline-none transition-[background-color,border-color] duration-default placeholder:text-tertiary hover:bg-surface-muted focus-visible:border-focus-ring disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}
