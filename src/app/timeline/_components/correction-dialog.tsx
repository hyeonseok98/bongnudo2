"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { TimelineEvent } from "@/features/timeline/timeline";
import { buildCorrectionRequest } from "@/features/reports/report-form";
import { reportMutations } from "@/queries/report-mutations";

interface CorrectionDialogProps {
  event: TimelineEvent;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function CorrectionDialog({
  event,
  onClose,
  onSuccess,
}: CorrectionDialogProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation(reportMutations.create());

  async function handleSubmit(submitEvent: React.FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    setError(null);

    try {
      await mutation.mutateAsync(
        buildCorrectionRequest(event.id, event.title, content),
      );
      onSuccess("수정 요청이 접수되었습니다.");
      onClose();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "수정 요청을 저장하지 못했습니다.",
      );
    }
  }

  return (
    <DialogPrimitive.Root
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      open
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-modal bg-black/60" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-modal w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-default bg-surface-raised shadow-2xl outline-none">
          <header className="flex items-start gap-3 border-b border-default p-5">
            <span className="min-w-0 flex-1">
              <DialogPrimitive.Title className="block text-body font-semibold text-primary">
                잘못된 정보 수정 요청
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1 block text-caption text-secondary">
                확인이 필요한 내용을 구체적으로 알려주세요.
              </DialogPrimitive.Description>
            </span>
            <Button aria-label="수정 요청 닫기" onClick={onClose} size="icon-sm" variant="ghost">
              <X aria-hidden="true" />
            </Button>
          </header>
          <form className="space-y-5 p-5" onSubmit={handleSubmit}>
            <dl className="grid grid-cols-[5rem_1fr] gap-x-3 gap-y-2 rounded-lg border border-default bg-surface-muted p-4 text-body-sm">
              <dt className="text-tertiary">분류</dt>
              <dd className="text-primary">{event.category.name}</dd>
              <dt className="text-tertiary">제목</dt>
              <dd className="font-medium text-primary">{event.title}</dd>
              <dt className="text-tertiary">발생일</dt>
              <dd className="text-primary">
                {new Intl.DateTimeFormat("ko-KR", {
                  dateStyle: "medium",
                  timeZone: "Asia/Seoul",
                }).format(new Date(event.occurredAt))}
              </dd>
            </dl>
            <label className="grid gap-1.5 text-caption font-semibold text-secondary">
              수정이 필요한 내용
              <Textarea
                maxLength={400}
                onChange={(changeEvent) => setContent(changeEvent.target.value)}
                placeholder="잘못된 내용과 올바른 정보를 함께 작성해주세요."
                required
                value={content}
              />
              <span className="text-right font-normal text-tertiary">
                {content.length}/400
              </span>
            </label>
            {error ? (
              <p className="text-caption text-status-danger" role="alert">
                {error}
              </p>
            ) : null}
            <footer className="flex justify-end gap-2 border-t border-default pt-4">
              <Button onClick={onClose} type="button" variant="outline">
                취소
              </Button>
              <Button disabled={mutation.isPending} type="submit">
                {mutation.isPending ? "요청 중..." : "수정 요청 보내기"}
              </Button>
            </footer>
          </form>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
