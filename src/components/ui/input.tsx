import { Input as InputPrimitive } from "@base-ui/react/input";
import type { InputHTMLAttributes, Ref } from "react";

import { cn } from "@/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  ref?: Ref<HTMLInputElement>;
}

function Input({ className, type, ...props }: InputProps) {
  return (
    <InputPrimitive
      className={cn(
        "h-11 w-full min-w-0 rounded-lg border border-control bg-background px-3 text-body-sm text-primary transition-[background-color,border-color] duration-default outline-none placeholder:text-tertiary hover:bg-surface-muted focus-visible:border-focus-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
        className,
      )}
      data-slot="input"
      type={type}
      {...props}
    />
  );
}

export { Input };
