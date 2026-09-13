"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

interface ReportLoginDialogProps {
  intent: "report" | "correction";
  onClose: () => void;
}

export function ReportLoginDialog({
  intent,
  onClose,
}: ReportLoginDialogProps) {
  const router = useRouter();
  const actionDescription =
    intent === "report" ? "제보를" : "수정 요청을";

  function handleLogin(): void {
    const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  return (
    <DialogPrimitive.Root
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      open
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-modal bg-black/60 transition-opacity duration-default data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-modal w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-default bg-surface-raised p-5 shadow-2xl outline-none">
          <DialogPrimitive.Title className="text-body font-semibold text-primary">
            로그인이 필요합니다
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-2 text-body-sm text-secondary">
            {actionDescription} 작성하려면 로그인해야 합니다. 로그인 페이지로
            이동하시겠습니까?
          </DialogPrimitive.Description>
          <div className="mt-5 flex justify-end gap-2">
            <Button onClick={onClose} variant="outline">
              취소
            </Button>
            <Button onClick={handleLogin}>로그인으로 이동</Button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
