"use client";

import { Popover } from "@base-ui/react/popover";
import { Ellipsis } from "lucide-react";

import { Button } from "@/components/ui/button";

interface TimelineRowActionsProps {
  eventId: string;
  onRequestCorrection?: (eventId: string) => void;
  reportCount: number;
}

export function TimelineRowActions({
  eventId,
  onRequestCorrection,
  reportCount,
}: TimelineRowActionsProps) {
  return (
    <Popover.Root>
      <Popover.Trigger
        render={
          <Button
            aria-label="기록 작업 열기"
            size="icon-sm"
            variant="ghost"
          />
        }
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        <Ellipsis aria-hidden="true" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          align="end"
          className="z-popover"
          collisionPadding={16}
          sideOffset={6}
        >
          <Popover.Popup
            className="w-52 rounded-lg border border-default bg-surface-raised p-1 shadow-xl outline-none"
            onClick={(clickEvent) => clickEvent.stopPropagation()}
          >
            <Popover.Title className="sr-only">기록 작업</Popover.Title>
            <p className="px-3 py-2 text-body-sm text-secondary">
              제보 이력 · {reportCount}건
            </p>
            {onRequestCorrection ? (
              <button
                className="w-full cursor-pointer rounded-md px-3 py-2 text-left text-body-sm text-primary hover:bg-surface-muted"
                onClick={() => onRequestCorrection(eventId)}
                type="button"
              >
                잘못된 정보 수정 요청
              </button>
            ) : null}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
