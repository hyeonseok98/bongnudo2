import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

interface MainContainerProps {
  children: ReactNode;
  className?: string;
}

export function MainContainer({ children, className }: MainContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto min-h-full w-full min-w-0 max-w-400 px-4 md:px-6 lg:px-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
