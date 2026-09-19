"use client";

import { Popover } from "@base-ui/react/popover";
import { EllipsisVertical } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

interface CollectedMediaActionsMenuProps {
  children: ReactNode;
  label: string;
}

export function CollectedMediaActionsMenu({
  children,
  label,
}: CollectedMediaActionsMenuProps) {
  return (
    <div
      className="absolute top-2 right-2 z-10"
      onClick={(event) => event.stopPropagation()}
    >
      <Popover.Root>
        <Popover.Trigger
          aria-label={label}
          className={cn(
            "grid size-7 cursor-pointer place-items-center rounded-md bg-black/70 text-white outline-none transition-colors duration-default hover:bg-black/85 focus-visible:ring-2 focus-visible:ring-focus-ring",
            "motion-reduce:transition-none",
          )}
        >
          <EllipsisVertical aria-hidden="true" className="size-4" />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner
            align="end"
            className="z-popover"
            collisionPadding={12}
            positionMethod="fixed"
            sideOffset={8}
          >
            <Popover.Popup className="w-60 rounded-lg border border-default bg-surface-raised p-2 shadow-lg outline-none">
              <Popover.Title className="sr-only">{label}</Popover.Title>
              {children}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
