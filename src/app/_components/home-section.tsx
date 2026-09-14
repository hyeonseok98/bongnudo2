import { ChevronRight } from "lucide-react";
import Link from "next/link";

export function HomeDirectoryLink({
  children,
  href,
}: {
  children: string;
  href: "/characters" | "/live" | "/organizations" | "/timeline";
}) {
  return (
    <Link
      className="inline-flex shrink-0 items-center gap-1 rounded-md text-body-sm font-medium text-secondary transition-colors duration-default hover:text-primary"
      href={href}
    >
      {children}
      <ChevronRight aria-hidden="true" className="size-4" />
    </Link>
  );
}

export function HomeSectionMessage({
  children,
  isError = false,
}: {
  children: string;
  isError?: boolean;
}) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-xl border border-default bg-surface-muted px-5 py-8 text-center">
      <p
        className={
          isError
            ? "text-body-sm text-status-danger"
            : "text-body-sm text-secondary"
        }
        role={isError ? "alert" : "status"}
      >
        {children}
      </p>
    </div>
  );
}
