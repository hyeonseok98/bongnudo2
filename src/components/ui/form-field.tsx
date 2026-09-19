import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

interface FormFieldProps {
  children: ReactNode;
  className?: string;
  error?: string;
  hint?: ReactNode;
  label: string;
  required?: boolean;
  requiredIndicator?: "asterisk" | "text";
}

export function FormField({
  children,
  className,
  error,
  hint,
  label,
  required = false,
  requiredIndicator = "text",
}: FormFieldProps) {
  return (
    <label className={cn("block space-y-2", className)}>
      <span className="block text-body-sm font-medium text-primary">
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-2 text-caption font-medium text-status-danger">
            {requiredIndicator === "asterisk" ? "*" : "필수"}
          </span>
        ) : null}
      </span>
      {children}
      {hint ? <span className="block text-caption text-secondary">{hint}</span> : null}
      {error ? (
        <span className="block text-caption text-status-danger" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}
